import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

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
          <h1 className="text-2xl font-bold text-gray-900">Brand Voices</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure tone and style for your generated content.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {brandVoices.map((voice) => (
          <div
            key={voice.id}
            className="rounded-lg border bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900">{voice.name}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tone: {voice.tone}
            </p>
            <p className="text-sm text-gray-500">POV: {voice.pointOfView}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
              <span>{voice._count.articles} articles</span>
              <span>{formatDate(voice.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
