import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const savedFiles = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filename = `${timestamp}_${safeName}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);

      const isVideo = file.type.startsWith("video/");
      savedFiles.push({
        type: isVideo ? "video" : "image",
        filename,
        url: `/uploads/${filename}`,
        originalName: file.name,
      });
    }

    return NextResponse.json({ files: savedFiles }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
