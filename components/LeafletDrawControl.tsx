"use client";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

// Fix for Leaflet Draw icon issues if needed, but usually CSS handles it.

interface LeafletDrawControlProps {
    onCreated: (layer: any) => void;
}

export default function LeafletDrawControl({ onCreated }: LeafletDrawControlProps) {
    const map = useMap();
    const controlRef = useRef<L.Control.Draw | null>(null);

    useEffect(() => {
        if (!map) return;

        // Configuration for Japanese labels can be done here if needed
        L.drawLocal.draw.toolbar.buttons.polygon = "エリアを描画";
        L.drawLocal.draw.toolbar.actions.title = "描画をキャンセル";
        L.drawLocal.draw.toolbar.actions.text = "キャンセル";
        L.drawLocal.draw.toolbar.finish.title = "描画を終了";
        L.drawLocal.draw.toolbar.finish.text = "終了";
        L.drawLocal.draw.toolbar.undo.title = "最後の点を削除";
        L.drawLocal.draw.toolbar.undo.text = "最後の点を削除";

        // Initialize draw control
        const drawControl = new L.Control.Draw({
            draw: {
                polygon: {
                    allowIntersection: false,
                    showArea: true,
                    metric: true,
                    shapeOptions: {
                        color: "#3388ff",
                        weight: 4
                    }
                },
                // Disable other shapes for now as per requirement (only polygons mentioned)
                polyline: false,
                circle: false,
                rectangle: false,
                marker: false,
                circlemarker: false,
            }
        });

        map.addControl(drawControl);
        controlRef.current = drawControl;

        // Event listener
        const createdHandler = (e: any) => {
            const layer = e.layer;
            onCreated(layer);
            // We don't add the layer to the map here immediately or we remove it?
            // Usually we want to save to DB, then DB updates state, then state renders polygon.
            // So we should remove the drawn layer immediately to avoid duplication.
            map.removeLayer(layer);
        };

        map.on(L.Draw.Event.CREATED, createdHandler);

        return () => {
            if (controlRef.current) {
                map.removeControl(controlRef.current);
            }
            map.off(L.Draw.Event.CREATED, createdHandler);
        };
    }, [map, onCreated]);

    return null;
}
