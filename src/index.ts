#!/usr/bin/env node

import { program } from "commander";
import { promises } from "fs";
import { glob } from "glob";
import { basename } from "path";

function removeValues(text: string) {
    const newLines: string[] = [];

    text.split("\n").forEach((line) => {
        if (line.startsWith("#")) {
            newLines.push(line);
            return;
        }

        const commentI = line.indexOf("#");
        const i = line.indexOf("=");

        // If the comment is before the '=', keep the line as is
        if (commentI !== -1 && (i === -1 || commentI < i)) {
            newLines.push(line);
            return;
        }

        if (i === -1) {
            newLines.push(line);
            return;
        }

        const key = line.substring(0, i);
        newLines.push(`${key}=`);
    });

    return newLines.join("\n");
}

program.name("dotenv-templates").description("Create dotenv templates from .env files").version("0.1.0");

program
    .option("-i, --include [patterns...]", "Include patterns", ["./**/.env", "./**/.env.*"])
    .option("-e, --exclude [patterns...]", "Exclude patterns")
    .action(async (opts) => {
        const excludePatterns = opts.exclude || [];
        const includePatterns = opts.include || [];
        const files = await glob(includePatterns, { ignore: excludePatterns });
        const createdFiles: string[] = [];

        await Promise.all(
            files.map(async (filePath) => {
                const fileName = basename(filePath);

                if (!fileName.startsWith(".env") || fileName.endsWith(".template")) {
                    return;
                }

                const newPath = filePath + ".template";
                const text = await promises.readFile(filePath, "utf-8");

                await promises.writeFile(newPath, removeValues(text), "utf-8");

                createdFiles.push(newPath);
            })
        );

        if (createdFiles.length) {
            console.log("✅ Created Templates:");
        } else {
            console.log("No .env files found");
        }

        createdFiles.forEach((file) => {
            console.log(file);
        });
    })
    .parse();
