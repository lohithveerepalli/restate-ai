"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStudioStore } from "@/stores/studio-store";
import { CESIUM_BASE_URL } from "@/lib/constants";
import { DEFAULT_CAMERA } from "@/types";
import { setTimeFromHours } from "@/lib/cesium/helpers";
import {
  calculateAreaAcres,
  calculateCentroid,
  haversineDistanceMeters,
} from "@/lib/geo";
import type { PolygonPoint } from "@/types";

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

export default function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<import("cesium").Viewer | null>(null);
  const cesiumRef = useRef<typeof import("cesium") | null>(null);
  const polygonEntityRef = useRef<import("cesium").Entity | null>(null);
  const pointEntitiesRef = useRef<import("cesium").Entity[]>([]);
  const modelEntityRef = useRef<import("cesium").Entity | null>(null);
  const measureEntitiesRef = useRef<import("cesium").Entity[]>([]);
  const handlerRef = useRef<import("cesium").ScreenSpaceEventHandler | null>(
    null
  );
  const tilesetRef = useRef<import("cesium").Cesium3DTileset | null>(null);

  const mode = useStudioStore((s) => s.mode);
  const polygon = useStudioStore((s) => s.polygon);
  const isPolygonClosed = useStudioStore((s) => s.isPolygonClosed);
  const layers = useStudioStore((s) => s.layers);
  const timeOfDay = useStudioStore((s) => s.timeOfDay);
  const modelUrl = useStudioStore((s) => s.modelUrl);
  const modelTransform = useStudioStore((s) => s.modelTransform);
  const centroid = useStudioStore((s) => s.centroid);
  const measurePoints = useStudioStore((s) => s.measurePoints);
  const pendingCameraPreset = useStudioStore((s) => s.pendingCameraPreset);
  const flyToRequest = useStudioStore((s) => s.flyToRequest);

  const addPolygonPoint = useStudioStore((s) => s.addPolygonPoint);
  const closePolygon = useStudioStore((s) => s.closePolygon);
  const setMapReady = useStudioStore((s) => s.setMapReady);
  const addMeasurePoint = useStudioStore((s) => s.addMeasurePoint);
  const setMeasurePoints = useStudioStore((s) => s.setMeasurePoints);
  const clearCameraPreset = useStudioStore((s) => s.clearCameraPreset);
  const clearFlyTo = useStudioStore((s) => s.clearFlyTo);
  const setTimeOfDay = useStudioStore((s) => s.setTimeOfDay);

  // Initialize Cesium
  useEffect(() => {
    let destroyed = false;

    async function init() {
      if (!containerRef.current || viewerRef.current) return;

      window.CESIUM_BASE_URL = CESIUM_BASE_URL;

      const Cesium = await import("cesium");
      await import("cesium/Build/Cesium/Widgets/widgets.css");
      if (destroyed) return;

      cesiumRef.current = Cesium;

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        creditContainer: document.createElement("div"),
        terrain: undefined,
        baseLayer: false,
      });

      viewer.scene.globe.show = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0b1220");
      viewer.scene.backgroundColor =
        Cesium.Color.fromCssColorString("#050a14");
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;
      viewer.scene.skyAtmosphere!.show = true;
      viewer.shadows = true;
      viewer.terrainShadows = Cesium.ShadowMode.RECEIVE_ONLY;
      viewer.shadowMap.softShadows = true;
      viewer.shadowMap.size = 2048;
      viewer.scene.globe.shadows = Cesium.ShadowMode.RECEIVE_ONLY;

      // Imagery fallback so the globe is never blank without tiles key
      try {
        viewer.imageryLayers.removeAll();
        viewer.imageryLayers.addImageryProvider(
          await Cesium.IonImageryProvider.fromAssetId(2)
        );
      } catch {
        // Ion may not be configured — openstreetmap fallback
        try {
          viewer.imageryLayers.addImageryProvider(
            new Cesium.UrlTemplateImageryProvider({
              url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
              credit: "© OpenStreetMap",
            })
          );
        } catch {
          /* empty */
        }
      }

      // Google Photorealistic 3D Tiles
      // https://cesium.com/learn/cesiumjs/ref-doc/global.html#createGooglePhotorealistic3DTileset
      if (apiKey) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const C = Cesium as any;
          if (C.GoogleMaps) {
            C.GoogleMaps.defaultApiKey = apiKey;
          }
          const tileset = await Cesium.createGooglePhotorealistic3DTileset();
          viewer.scene.primitives.add(tileset);
          tilesetRef.current = tileset;
          viewer.scene.globe.show = false;
        } catch (e) {
          console.warn("3D Tiles unavailable, using globe imagery", e);
          viewer.scene.globe.show = true;
        }
      }

      // Default camera — Texas Hill Country
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          DEFAULT_CAMERA.longitude,
          DEFAULT_CAMERA.latitude,
          DEFAULT_CAMERA.height
        ),
        orientation: {
          heading: Cesium.Math.toRadians(DEFAULT_CAMERA.heading),
          pitch: Cesium.Math.toRadians(DEFAULT_CAMERA.pitch),
          roll: DEFAULT_CAMERA.roll,
        },
      });

      setTimeFromHours(Cesium, viewer.clock, 14);
      viewer.scene.globe.enableLighting = true;
      viewer.scene.light = new Cesium.SunLight();

      // Smooth camera inertia
      viewer.scene.screenSpaceCameraController.inertiaSpin = 0.9;
      viewer.scene.screenSpaceCameraController.inertiaTranslate = 0.9;
      viewer.scene.screenSpaceCameraController.inertiaZoom = 0.8;
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 20;
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 5_000_000;

      viewerRef.current = viewer;
      setMapReady(true);
    }

    init().catch((err) => console.error("Cesium init failed", err));

    return () => {
      destroyed = true;
      handlerRef.current?.destroy();
      handlerRef.current = null;
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
      }
      viewerRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click / double-click handlers based on mode
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    handlerRef.current?.destroy();
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerRef.current = handler;

    const pickPosition = (pos: import("cesium").Cartesian2) => {
      let cartesian: import("cesium").Cartesian3 | undefined =
        viewer.scene.pickPosition(pos) ?? undefined;
      if (!cartesian) {
        const ray = viewer.camera.getPickRay(pos);
        if (ray) {
          const picked = viewer.scene.globe.pick(ray, viewer.scene);
          cartesian = picked ?? undefined;
        }
      }
      if (!cartesian) return null;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      return {
        longitude: Cesium.Math.toDegrees(carto.longitude),
        latitude: Cesium.Math.toDegrees(carto.latitude),
        height: carto.height,
      } as PolygonPoint;
    };

    if (mode === "draw") {
      handler.setInputAction(
        (click: { position: import("cesium").Cartesian2 }) => {
          const pt = pickPosition(click.position);
          if (pt) addPolygonPoint(pt);
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );

      handler.setInputAction(() => {
        closePolygon();
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    }

    if (mode === "measure") {
      handler.setInputAction(
        (click: { position: import("cesium").Cartesian2 }) => {
          const pt = pickPosition(click.position);
          if (!pt) return;
          const current = useStudioStore.getState().measurePoints;
          if (current.length >= 2) {
            setMeasurePoints([pt]);
          } else {
            addMeasurePoint(pt);
            if (current.length === 1) {
              const a = current[0]!;
              const dist = haversineDistanceMeters(
                { lat: a.latitude, lng: a.longitude },
                { lat: pt.latitude, lng: pt.longitude }
              );
              useStudioStore.setState({ measureDistanceM: dist });
            }
          }
        },
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
    }

    return () => {
      handler.destroy();
      if (handlerRef.current === handler) handlerRef.current = null;
    };
  }, [
    mode,
    addPolygonPoint,
    closePolygon,
    addMeasurePoint,
    setMeasurePoints,
  ]);

  // Draw / update polygon graphics
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    // Clear previous points
    pointEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    pointEntitiesRef.current = [];
    if (polygonEntityRef.current) {
      viewer.entities.remove(polygonEntityRef.current);
      polygonEntityRef.current = null;
    }

    if (!layers.polygon || polygon.length === 0) return;

    polygon.forEach((p, i) => {
      const ent = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          p.longitude,
          p.latitude,
          (p.height ?? 0) + 2
        ),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromCssColorString("#38bdf8"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label:
          i === 0
            ? {
                text: "Start",
                font: "12px Inter, sans-serif",
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                pixelOffset: new Cesium.Cartesian2(0, -18),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              }
            : undefined,
      });
      pointEntitiesRef.current.push(ent);
    });

    if (polygon.length >= 2) {
      const positions = polygon.map((p) =>
        Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
      );
      if (isPolygonClosed && polygon.length >= 3) {
        positions.push(
          Cesium.Cartesian3.fromDegrees(
            polygon[0]!.longitude,
            polygon[0]!.latitude
          )
        );
      }

      polygonEntityRef.current = viewer.entities.add({
        polyline: {
          positions,
          width: 3,
          material: Cesium.Color.fromCssColorString("#38bdf8"),
          clampToGround: true,
        },
        polygon:
          isPolygonClosed && polygon.length >= 3
            ? {
                hierarchy: new Cesium.PolygonHierarchy(
                  polygon.map((p) =>
                    Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude)
                  )
                ),
                material: Cesium.Color.fromCssColorString("#38bdf8").withAlpha(
                  0.25
                ),
                outline: true,
                outlineColor: Cesium.Color.fromCssColorString("#7dd3fc"),
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                classificationType: Cesium.ClassificationType.BOTH,
              }
            : undefined,
      });
    }
  }, [polygon, isPolygonClosed, layers.polygon]);

  // Measurement graphics
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    measureEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    measureEntitiesRef.current = [];

    measurePoints.forEach((p) => {
      const ent = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString("#fbbf24"),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      measureEntitiesRef.current.push(ent);
    });

    if (measurePoints.length === 2) {
      const [a, b] = measurePoints;
      const dist = haversineDistanceMeters(
        { lat: a!.latitude, lng: a!.longitude },
        { lat: b!.latitude, lng: b!.longitude }
      );
      const midLng = (a!.longitude + b!.longitude) / 2;
      const midLat = (a!.latitude + b!.latitude) / 2;
      const label =
        dist < 1000
          ? `${Math.round(dist)} m`
          : `${(dist / 1000).toFixed(2)} km`;

      measureEntitiesRef.current.push(
        viewer.entities.add({
          polyline: {
            positions: [
              Cesium.Cartesian3.fromDegrees(a!.longitude, a!.latitude),
              Cesium.Cartesian3.fromDegrees(b!.longitude, b!.latitude),
            ],
            width: 3,
            material: Cesium.Color.fromCssColorString("#fbbf24"),
            clampToGround: true,
          },
        }),
        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(midLng, midLat),
          label: {
            text: label,
            font: "14px Inter, sans-serif",
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 4,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -20),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        })
      );
    }
  }, [measurePoints]);

  // Place / update 3D model
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;

    if (modelEntityRef.current) {
      viewer.entities.remove(modelEntityRef.current);
      modelEntityRef.current = null;
    }

    if (!modelUrl || !centroid || !layers.model) return;

    const { scale, heading, heightOffset } = modelTransform;
    const position = Cesium.Cartesian3.fromDegrees(
      centroid.lng,
      centroid.lat,
      heightOffset || 0
    );
    const hpr = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(heading),
      0,
      0
    );
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      hpr
    );

    modelEntityRef.current = viewer.entities.add({
      name: "AI Development",
      position,
      orientation,
      model: {
        uri: modelUrl,
        scale,
        minimumPixelSize: 64,
        maximumScale: 20000,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        color: layers.wireframe
          ? Cesium.Color.CYAN.withAlpha(0.4)
          : Cesium.Color.WHITE,
        colorBlendMode: layers.wireframe
          ? Cesium.ColorBlendMode.MIX
          : Cesium.ColorBlendMode.HIGHLIGHT,
        colorBlendAmount: layers.wireframe ? 0.7 : 0,
        silhouetteColor: Cesium.Color.fromCssColorString("#38bdf8"),
        silhouetteSize: layers.wireframe ? 1.5 : 0,
        shadows: Cesium.ShadowMode.ENABLED,
      },
    });

    // Fly to model on first load
    const area = useStudioStore.getState().areaAcres;
    const range = Math.max(400, Math.sqrt(Math.max(area, 1) * 4047) * 2.5);
    viewer.flyTo(modelEntityRef.current, {
      duration: 2.2,
      offset: new Cesium.HeadingPitchRange(
        Cesium.Math.toRadians(30),
        Cesium.Math.toRadians(-30),
        range
      ),
    });
  }, [modelUrl, centroid, modelTransform, layers.model, layers.wireframe]);

  // Time of day
  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) return;
    setTimeFromHours(Cesium, viewer.clock, timeOfDay);
    viewer.shadows = layers.shadows;
    viewer.terrainShadows = layers.shadows
      ? Cesium.ShadowMode.RECEIVE_ONLY
      : Cesium.ShadowMode.DISABLED;
  }, [timeOfDay, layers.shadows]);

  // Camera presets
  useEffect(() => {
    if (!pendingCameraPreset) return;
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) {
      clearCameraPreset();
      return;
    }

    const center = centroid ?? {
      lat: DEFAULT_CAMERA.latitude,
      lng: DEFAULT_CAMERA.longitude,
    };
    const area = useStudioStore.getState().areaAcres || 25;
    const baseRange = Math.max(500, Math.sqrt(area * 4047) * 3);

    const fly = (
      heading: number,
      pitch: number,
      range: number,
      hour?: number
    ) => {
      const dest = Cesium.Cartesian3.fromDegrees(center.lng, center.lat, 0);
      viewer.camera.flyToBoundingSphere(
        new Cesium.BoundingSphere(dest, range * 0.35),
        {
          duration: 1.8,
          offset: new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(heading),
            Cesium.Math.toRadians(pitch),
            range
          ),
        }
      );
      if (hour !== undefined) setTimeOfDay(hour);
    };

    switch (pendingCameraPreset) {
      case "birds-eye":
        fly(0, -85, baseRange * 1.8, 12);
        break;
      case "ground":
        fly(45, -12, baseRange * 0.35, 15);
        break;
      case "golden-hour":
        fly(250, -28, baseRange, 17.5);
        break;
      case "dramatic-sunset":
        fly(280, -18, baseRange * 1.2, 19);
        break;
    }
    clearCameraPreset();
  }, [pendingCameraPreset, centroid, clearCameraPreset, setTimeOfDay]);

  // Fly-to requests (search / surprise)
  useEffect(() => {
    if (!flyToRequest) return;
    const viewer = viewerRef.current;
    const Cesium = cesiumRef.current;
    if (!viewer || !Cesium) {
      clearFlyTo();
      return;
    }
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyToRequest.lng,
        flyToRequest.lat,
        flyToRequest.height ?? 1800
      ),
      orientation: {
        heading: Cesium.Math.toRadians(20),
        pitch: Cesium.Math.toRadians(-40),
        roll: 0,
      },
      duration: 2.4,
    });
    clearFlyTo();
  }, [flyToRequest, clearFlyTo]);

  // Expose area recalculation when polygon closes (side-effect free helpers for consumers)
  useEffect(() => {
    if (isPolygonClosed && polygon.length >= 3) {
      calculateAreaAcres(polygon);
      calculateCentroid(polygon);
    }
  }, [isPolygonClosed, polygon]);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full"
      onContextMenu={onContextMenu}
    />
  );
}
