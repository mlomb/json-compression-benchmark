import { encode as msgpack_encode } from "@msgpack/msgpack";
import { compress as compress_json } from "compress-json";
import { pack as jsonpack_pack } from "jsonpack";

import { dumpBinary as dumpBinary_ion, dumpText as dumpText_ion } from "ion-js";

import * as fflate from "fflate";
// @ts-ignore
import { LZMA } from "lzma/src/lzma_worker-min";
// @ts-ignore
import cbor from "cbor-js";
// @ts-ignore
import { BaseEx } from "base-ex";

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
        name: "compress-json",
        fn: async (input: any) => compress_json(input),
    },
    {
        name: "jsonpack",
        fn: async (input: any) => jsonpack_pack(input),
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
        fn: async (input: Uint8Array) => fflate.gzipSync(input, { level: 9 }),
    },
    /*{
        name: "lzma",
        binary: true,
        fn: async (input: Uint8Array) => new Uint8Array(LZMA.compress(input)),
    },*/
];

const baseEx = new BaseEx("bytes", "bytes");

const encodingOptions: EncodingStep[] = [
    { name: "No encoding", acceptBinary: false, fn: async (input: Uint8Array) => new TextDecoder().decode(input) },
    { name: "base16", acceptBinary: true, fn: async (input: Uint8Array) => baseEx.base16.encode(input) },
    {
        name: "base32_rfc3548",
        acceptBinary: true,
        fn: async (input: Uint8Array) => baseEx.base32_rfc3548.encode(input),
    },
    { name: "base64", acceptBinary: true, fn: async (input: Uint8Array) => baseEx.base64.encode(input) },
    {
        name: "base64_urlsafe",
        acceptBinary: true,
        fn: async (input: Uint8Array) => baseEx.base64_urlsafe.encode(input),
    },
    { name: "base85adobe", acceptBinary: true, fn: async (input: Uint8Array) => baseEx.base85adobe.encode(input) },
    { name: "base85ascii", acceptBinary: true, fn: async (input: Uint8Array) => baseEx.base85ascii.encode(input) },
    { name: "base85_z85", acceptBinary: true, fn: async (input: Uint8Array) => baseEx.base85_z85.encode(input) },
    { name: "base91", acceptBinary: true, fn: async (input: Uint8Array) => baseEx.base91.encode(input) },
    /*{
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
    },*/
    {
        name: "base128",
        acceptBinary: true,
        fn: async (input: Uint8Array) => require("base128-encoding").encode(input),
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
