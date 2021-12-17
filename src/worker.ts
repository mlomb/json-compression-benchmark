import { packOptions, serializationOptions, compressionOptions, encodingOptions } from "./benchmarks";
import prettyBytes from "pretty-bytes";

const formatTime = (diffInMs: number) => `${(diffInMs / 1000).toFixed(2)}s`;

// eslint-disable-next-line
self.onmessage = async (e: MessageEvent<File>) => {
    console.log("Reading...");
    const input = await e.data.text();
    console.log("Reading OK");
    console.log("JSON.parse...");
    const data = JSON.parse(input);
    console.log("JSON.parse OK");

    // now start benchmarks
    console.log("Starting benchmarks...");

    for (const packStep of packOptions) {
        const packStart = performance.now();
        const packed = await packStep.fn(data);
        const packEnd = performance.now();
        const packTime = packEnd - packStart;

        for (const serializationStep of serializationOptions) {
            const serializationStart = performance.now();
            const serialized = await serializationStep.fn(packed);
            const serializationEnd = performance.now();
            const serializationTime = serializationEnd - serializationStart;
            const serializationSize = serialized.length;

            for (const compressionStep of compressionOptions) {
                const compressionStart = performance.now();
                const compressed: Uint8Array = await compressionStep.fn(serialized);
                const compressionEnd = performance.now();
                const compressionTime = compressionEnd - compressionStart;
                const compressionSize = compressed.length;

                for (const encodingStep of encodingOptions) {
                    // skip
                    if (!encodingStep.acceptBinary && (compressionStep.binary || serializationStep.binary)) continue;

                    const encodingStart = performance.now();
                    const encoded: string = await encodingStep.fn(compressed);
                    const encodingEnd = performance.now();
                    const encodingTime = encodingEnd - encodingStart;
                    const encodingSize = new TextEncoder().encode(encoded).length; // we are interested in bytes and NOT chars

                    console.log(`${serializationStep.name} -> ${compressionStep.name} -> ${encodingStep.name}`);
                    // eslint-disable-next-line
                    self.postMessage([
                        packStep.name,
                        formatTime(packTime),
                        serializationStep.name,
                        formatTime(serializationTime),
                        prettyBytes(serializationSize),
                        compressionStep.name,
                        formatTime(compressionTime),
                        prettyBytes(compressionSize),
                        encodingStep.name,
                        formatTime(encodingTime),
                        prettyBytes(encodingSize),
                    ]);
                }
            }
        }
    }

    console.log("Done");
    // eslint-disable-next-line
    self.close();
};

const nil = null;
export default nil;
