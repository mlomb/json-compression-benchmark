import "./index.css";
import React from "react";
import ReactDOM from "react-dom";

// @ts-ignore
import WWorker from "worker-loader!./worker"; // eslint-disable-line import/no-webpack-loader-syntax

const App = () => {
    const [file, setFile] = React.useState<FileList | null>(null);
    const [results, setResults] = React.useState<string[][]>([]);
    const [working, setWorking] = React.useState(false);

    const run = () => {
        const worker = new WWorker() as Worker;
        worker.onmessage = (ev: any) => setResults((results) => [...results, ev.data]);
        worker.postMessage(file!.item(0)!);
        setWorking(true);
    };

    const rowSpan = (i: number, j: number): number => {
        let k = i;
        while (k < results.length && results[k][j] === results[i][j]) k++;
        let res = k - i;
        return j > 0 ? Math.min(res, rowSpan(i, j - 1)) : res;
    };

    return (
        <>
            <div className="options">
                <fieldset>
                    <legend>JSON input</legend>
                    <input
                        type="file"
                        id="file"
                        onChange={(e) => setFile(e.target.files)}
                        accept="application/json"
                        disabled={working === true}
                    />
                </fieldset>
                <button disabled={file === null || file.length === 0 || working === true} onClick={run}>
                    Start
                </button>
            </div>
            <br />
            <table>
                <thead>
                    <tr>
                        <th colSpan={2}>Packing</th>
                        <th colSpan={3}>Serialization</th>
                        <th colSpan={3}>Compression</th>
                        <th colSpan={3}>Encoding</th>
                    </tr>
                    <tr>
                        <th>Algorithm</th>
                        <th>Time</th>
                        <th>Algorithm</th>
                        <th>Time</th>
                        <th>Size</th>
                        <th>Algorithm</th>
                        <th>Time</th>
                        <th>Size</th>
                        <th>Algorithm</th>
                        <th>Time</th>
                        <th style={{ backgroundColor: "#fcffad" }}>Size</th>
                    </tr>
                </thead>
                <tbody>
                    {working && results.length > 0 ? (
                        results.map((result, i) => (
                            <tr key={i}>
                                {result.map((r, j) =>
                                    i > 0 && rowSpan(i, j) < rowSpan(i - 1, j) ? (
                                        <></>
                                    ) : (
                                        <td
                                            key={j}
                                            rowSpan={rowSpan(i, j)}
                                            style={j === 10 ? { backgroundColor: "#fcffad" } : {}}
                                        >
                                            {r}
                                        </td>
                                    )
                                )}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={9} style={{ textAlign: "center" }}>
                                No results yet
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <p>Size is reported in bytes and NOT chars.</p>
        </>
    );
};

ReactDOM.render(<App />, document.getElementById("root"));
