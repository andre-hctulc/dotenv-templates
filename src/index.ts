#!/usr/bin/env node

import { program } from "commander";
import { promises } from "fs";
import { glob } from "glob";

function transformPath(path: string) {
    if (!path.endsWith(".env")) {
        throw new Error("Not a .env file");
    }

    const lastI = path.lastIndexOf(".");
    return path.substring(0, lastI) + ".template" + path.substring(lastI);
}

function removeValues(text: string) {
    const newLines: string[] = [];

    text.split("\n").forEach((line) => {
        if (line.startsWith("#")) {
            newLines.push(line);
            return;
        }

        const i = line.indexOf("=");

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
    .option("-i, --include [patterns...]", "Include patterns", ["./**/*.env"])
    .option("-e, --exclude [patterns...]", "Exclude patterns")
    .action(async (opts) => {
        const excludePatterns = opts.exclude || [];
        const includePatterns = opts.include || [];
        const files = await glob(includePatterns, { ignore: excludePatterns });
        const createdFiles: string[] = [];

        await Promise.all(
            files.map(async (file) => {
                if (!file.endsWith(".env")) {
                    return;
                }

                const newPath = transformPath(file);
                const text = await promises.readFile(file, "utf-8");

                await promises.writeFile(newPath, removeValues(text), "utf-8");

                createdFiles.push(newPath);
            })
        );

        console.log("✅ Created Files:");

        createdFiles.forEach((file) => {
            console.log(file);
        });
    })
    .parse();
