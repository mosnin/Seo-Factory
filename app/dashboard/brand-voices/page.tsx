import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { IconPlus } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function BrandVoicesPage() {
  const brandVoices = await prisma.brandVoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Voices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure tone and style for your generated content.
          </p>
        </div>
        <Button>
          <IconPlus className="mr-2 h-4 w-4" />
          New Voice
        </Button>
      </div>

      {brandVoices.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No brand voices"
          description="Define a brand voice to ensure consistent tone across all your generated articles."
          actionLabel="Create Voice"
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {brandVoices.map((voice) => (
            <Card key={voice.id}>
              <CardHeader>
                <CardTitle className="text-base">{voice.name}</CardTitle>
                <CardDescription>POV: {voice.pointOfView}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {voice.tone.split(",").map((t) => (
                    <Badge key={t.trim()} variant="secondary">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{voice._count.articles} articles</span>
                <span>{formatDate(voice.createdAt)}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
