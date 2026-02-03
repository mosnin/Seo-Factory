# ================================
# Cognito User Pool Configuration
# ================================

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-users-${var.environment}"

  # Username configuration
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = false
    temporary_password_validity_days = 7
  }

  # MFA configuration
  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # User attribute schema
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 0
      max_length = 256
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 0
      max_length = 256
    }
  }

  # Email configuration
  email_configuration {
    email_sending_account = "DEVELOPER"
    from_email_address    = var.ses_from_email
    source_arn            = "arn:aws:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/${var.ses_from_email}"
  }

  # Verification messages
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "Verify your ${var.project_name} account"
    email_message        = "Your verification code is {####}"
  }

  # Admin create user config
  admin_create_user_config {
    allow_admin_create_user_only = false

    invite_message_template {
      email_message = "Your username is {username} and temporary password is {####}."
      email_subject = "Your temporary password for ${var.project_name}"
      sms_message   = "Your username is {username} and temporary password is {####}."
    }
  }

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  # Deletion protection
  deletion_protection = "ACTIVE"

  tags = {
    Name = "${var.project_name}-user-pool-${var.environment}"
  }
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}-${random_id.suffix.hex}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.project_name}-app-client-${var.environment}"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth settings
  generate_secret                      = true
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  supported_identity_providers         = ["COGNITO"]

  # Callback URLs
  callback_urls = concat(
    var.cognito_callback_urls,
    var.domain_name != "" ? ["https://${var.domain_name}/api/auth/callback/cognito"] : []
  )

  logout_urls = concat(
    var.cognito_logout_urls,
    var.domain_name != "" ? ["https://${var.domain_name}"] : []
  )

  # Token validity
  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Read/write attributes
  read_attributes  = ["email", "name", "email_verified"]
  write_attributes = ["email", "name"]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Auth flows
  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

# Cognito Identity Pool (for AWS resource access)
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.project_name}-identity-${var.environment}"
  allow_unauthenticated_identities = false
  allow_classic_flow               = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.app.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = true
  }

  tags = {
    Name = "${var.project_name}-identity-pool-${var.environment}"
  }
}

# IAM Role for authenticated users
resource "aws_iam_role" "cognito_authenticated" {
  name = "${var.project_name}-cognito-authenticated-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
          }
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-cognito-auth-role-${var.environment}"
  }
}

# Identity Pool role attachment
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated" = aws_iam_role.cognito_authenticated.arn
  }
}
