output "cognito_user_pool_id" {
  description = "Cognito User Pool ID (set as NEXT_PUBLIC_COGNITO_USER_POOL_ID)"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID (set as NEXT_PUBLIC_COGNITO_CLIENT_ID)"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_region" {
  description = "AWS region (set as NEXT_PUBLIC_COGNITO_REGION)"
  value       = var.aws_region
}

output "lambda_function_name" {
  description = "Post-confirmation Lambda function name"
  value       = aws_lambda_function.post_confirmation.function_name
}
