import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { projectName, area, headcount, shape, notes } = body;

    if (!projectName) {
      return NextResponse.json(
        { error: "프로젝트 이름이 없습니다." },
        { status: 400 }
      );
    }

    const prompt = `
Create a professional 3D isometric office furniture layout concept image.

Project name: ${projectName}
Area: ${area || "unknown"}
Headcount: ${headcount ?? "unknown"}
Room shape: ${shape || "unknown"}
Additional requirements: ${notes || "none"}

Requirements:
- modern office interior
- 3D isometric layout view
- clean architectural presentation style
- desk arrangement optimized for the given headcount
- include meeting area
- include pantry or lounge area if suitable
- realistic office furniture placement
- bright neutral colors
- top-down isometric perspective
- no text labels inside the image
- single office floor concept
`;

    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "이미지 생성 결과가 비어 있습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      imageBase64,
      prompt,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message || "3D 배치 시안 생성 중 알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
