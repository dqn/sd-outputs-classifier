import ExifReader from "exifreader";
import { mkdir, readdir, readFile, rename } from "fs/promises";
import path from "path";

function normalizeTag(tag: string[]): string {
  return tag.join("-").replaceAll(/\s/g, "-");
}

async function main(): Promise<void> {
  const dir = process.argv[2];

  const files = await readdir(dir);

  const tags = await readFile("./tags.txt", "utf-8").then((raw) =>
    raw
      .trim()
      .split(/\n|\r\n|\r/)
      .map((rawTag) =>
        rawTag.split(",").map((tag) => tag.trim().replace(/\s+/g, " "))
      )
  );

  const outDir = path.dirname(dir);

  await Promise.all(
    tags.map((tag) => {
      return mkdir(path.join(outDir, normalizeTag(tag)), { recursive: true });
    })
  );

  await Promise.all(
    files.map(async (file) => {
      const exif = await ExifReader.load(path.join(dir, file));
      const params = exif.parameters.description;

      const tag = tags.find((tag) => tag.every((t) => params.includes(t)));

      if (tag !== undefined) {
        const normalizedTag = normalizeTag(tag);
        await rename(
          path.join(dir, file),
          path.join(outDir, normalizedTag, file)
        );
        console.log(`${file} was classified to "${normalizedTag}"`);
      } else {
        console.warn(`WARN: ${file} was not classified`);
      }
    })
  );

  console.log("completed");
}

await main();
