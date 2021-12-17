import { encode as msgpack_encode } from "@msgpack/msgpack";
import { compress as compress_json } from "compress-json";
import { pack as jsonpack_pack } from "jsonpack";

import { dumpBinary as dumpBinary_ion, dumpText as dumpText_ion } from "ion-js";

import * as fflate from "fflate";
// @ts-ignore
import { LZMA } from "lzma/src/lzma_worker-min";
// @ts-ignore
import cbor from "cbor-js";

// POCO object => POCO object
interface PackStep {
    name: string;
    fn: (data: any) => Promise<any>;
}

// POCO object => binary
interface SerializationStep {
    name: string;
    binary: boolean;
    fn: (input: any) => Promise<Uint8Array>;
}

// binary => (hopefully smaller) binary
interface CompressionStep {
    name: string;
    binary: boolean;
    fn: (input: Uint8Array) => Promise<Uint8Array>;
}

// binary => string
interface EncodingStep {
    name: string;
    acceptBinary: boolean;
    fn: (input: Uint8Array) => Promise<string>;
}

const packOptions: PackStep[] = [
    {
        name: "No packing",
        fn: async (data: any) => data,
    },
    {
        name: "jsonpack",
        fn: async (input: any) => jsonpack_pack(input),
    },
    {
        name: "compress-json",
        fn: async (input: any) => compress_json(input),
    },
];

const serializationOptions: SerializationStep[] = [
    {
        name: "JSON.stringify",
        binary: false,
        fn: async (input: any) => new TextEncoder().encode(JSON.stringify(input)),
    },
    {
        name: "msgpack",
        binary: true,
        fn: async (input: any) => msgpack_encode(input),
    },
    {
        name: "cbor",
        binary: true,
        fn: async (input: any) => new Uint8Array(cbor.encode(input)),
    },
    {
        name: "binary ion",
        binary: true,
        fn: async (input: any) => dumpBinary_ion(input),
    },
    {
        name: "textual ion",
        binary: false,
        fn: async (input: any) => new TextEncoder().encode(dumpText_ion(input)),
    },
];

const compressionOptions: CompressionStep[] = [
    {
        name: "No compression",
        binary: false,
        fn: async (input: Uint8Array) => input,
    },
    {
        name: "gzip",
        binary: true,
        fn: async (input: Uint8Array) => fflate.gzipSync(input),
    },
    {
        name: "lzma",
        binary: true,
        fn: async (input: Uint8Array) => new Uint8Array(LZMA.compress(input)),
    },
];

const encodingOptions: EncodingStep[] = [
    {
        name: "No encoding",
        acceptBinary: false,
        fn: async (input: Uint8Array) => new TextDecoder().decode(input),
    },
    {
        name: "base64",
        acceptBinary: true,
        fn: async (input: Uint8Array) => {
            const base64url = await new Promise((r) => {
                const reader = new FileReader();
                reader.onload = () => r(reader.result);
                reader.readAsDataURL(new Blob([input]));
            });
            return (base64url as string).split(",", 2)[1] || "";
        },
    },
    {
        name: "base2048",
        acceptBinary: true,
        fn: async (input: Uint8Array) => require("base2048").encode(input),
    },
    {
        name: "base32768",
        acceptBinary: true,
        fn: async (input: Uint8Array) => require("base32768").encode(input),
    },
    {
        name: "base65536",
        acceptBinary: true,
        fn: async (input: Uint8Array) => require("base65536").encode(input),
    },
];

export { packOptions, serializationOptions, compressionOptions, encodingOptions };
