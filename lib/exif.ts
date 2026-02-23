import exifr from "exifr";

// Convert DMS (degrees, minutes, seconds) to decimal degrees
// より柔軟なDMS変換に対応
function dmsToDecimal(dms: number[] | number | undefined, ref?: string): number | undefined {
    if (dms === undefined || dms === null) return undefined;

    // すでに10進数の場合
    if (typeof dms === 'number') {
        let decimal = dms;
        // 南緯(S)または西経(W)の場合はマイナスにする
        if (ref === 'S' || ref === 'W') {
            decimal = -decimal;
        }
        return decimal;
    }

    // 配列（度、分、秒など）の場合
    if (Array.isArray(dms) && dms.length >= 1) {
        const degrees = dms[0] || 0;
        const minutes = dms[1] || 0;
        const seconds = dms[2] || 0;

        let decimal = degrees + minutes / 60 + seconds / 3600;

        // 南緯(S)または西経(W)の場合はマイナスにする
        if (ref === 'S' || ref === 'W') {
            decimal = -decimal;
        }
        return decimal;
    }

    return undefined;
}

export async function getExifData(file: File) {
    try {
        // GPSデータを取得する exifr の公式関数を試行（大半はこれで取れる）
        const gpsData = await exifr.gps(file);

        // それ以外のメタデータ（日時など）やカスタムパース用
        const output = await exifr.parse(file, ["GPSLatitude", "GPSLongitude", "GPSLatitudeRef", "GPSLongitudeRef", "DateTimeOriginal"]);

        let lat: number | undefined;
        let lng: number | undefined;

        if (gpsData && gpsData.latitude != null && gpsData.longitude != null) {
            // exifr.gps() が成功した場合
            lat = gpsData.latitude;
            lng = gpsData.longitude;
        } else if (output) {
            // カスタムのDMS変換を利用
            lat = dmsToDecimal(output.GPSLatitude, output.GPSLatitudeRef);
            lng = dmsToDecimal(output.GPSLongitude, output.GPSLongitudeRef);
        }

        return {
            lat,
            lng,
            date: output?.DateTimeOriginal,
        };
    } catch (e) {
        console.error("EXIFデータの解析中にエラーが発生しました:", e);
        // エラーの内容を文字列として返すことで、呼び出し元でデバッグしやすくする
        return {
            error: e instanceof Error ? e.message : "不明なエラー"
        };
    }
}
