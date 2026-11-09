"""
Indian Railway Coach 3D Model Generator — Blender Python Script

This script generates detailed 3D models of Indian Railway LHB coaches
for use in the Rail Explorer web application.

Usage:
  blender --background --python blender/generate_coaches.py

Output:
  public/models/*.glb — Exported GLTF binary files

Coach types generated:
  - LHB Sleeper (SL) — 80 berths
  - LHB AC 3-Tier (3A) — 72 berths
  - LHB AC 2-Tier (2A) — 52 berths
  - LHB First AC (1A) — 24 berths
  - LHB Chair Car (CC) — 78 seats
  - LHB Pantry Car (PC)
  - LHB EOG (End-on Generator)
  - Locomotive (WAP-7 style)

Dimensions based on RDSO specifications:
  - LHB body length: 23,540 mm
  - LHB over couplers: 24,000 mm
  - Width: 3,245 mm
  - Height: ~4,039 mm

NOTE: This script requires Blender 3.6+ with Python scripting support.
Run with: blender --background --python generate_coaches.py
"""

import bpy
import math
import os

# Scale: 1 Blender unit = 1 meter
COACH_LENGTH = 23.54
COACH_WIDTH = 3.245
COACH_HEIGHT = 2.8
ROOF_HEIGHT = 0.5
UNDERFRAME_HEIGHT = 0.4
BOGIE_OFFSET = 7.45  # from center to bogie center

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'models')

COACH_CONFIGS = {
    'sleeper': {
        'name': 'LHB_Sleeper',
        'color': (0.29, 0.49, 0.35, 1.0),  # Indian Railways green
        'berths': 80,
        'bays': 10,
        'windows': 12,
        'has_ac': False,
    },
    'ac3': {
        'name': 'LHB_AC3Tier',
        'color': (0.12, 0.23, 0.37, 1.0),  # Dark blue
        'berths': 72,
        'bays': 9,
        'windows': 10,
        'has_ac': True,
    },
    'ac2': {
        'name': 'LHB_AC2Tier',
        'color': (0.29, 0.0, 0.51, 1.0),  # Indigo
        'berths': 52,
        'bays': 9,
        'windows': 9,
        'has_ac': True,
    },
    'first_ac': {
        'name': 'LHB_FirstAC',
        'color': (0.55, 0.0, 0.0, 1.0),  # Dark red
        'berths': 24,
        'bays': 8,
        'windows': 6,
        'has_ac': True,
    },
    'chair_car': {
        'name': 'LHB_ChairCar',
        'color': (0.72, 0.53, 0.04, 1.0),  # Gold
        'berths': 78,
        'bays': 16,
        'windows': 14,
        'has_ac': True,
    },
    'pantry': {
        'name': 'LHB_PantryCar',
        'color': (0.80, 0.52, 0.25, 1.0),  # Tan
        'berths': 0,
        'bays': 0,
        'windows': 4,
        'has_ac': True,
    },
    'eog': {
        'name': 'LHB_EOG',
        'color': (0.41, 0.41, 0.41, 1.0),  # Gray
        'berths': 0,
        'bays': 0,
        'windows': 2,
        'has_ac': False,
    },
}


def clear_scene():
    """Remove all objects from the scene."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)


def create_material(name, color, metallic=0.3, roughness=0.5):
    """Create a PBR material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = color
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
    return mat


def create_coach_body(config):
    """Create the main coach body with windows and doors."""
    name = config['name']
    color = config['color']

    # Main body
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = f"{name}_Body"
    body.scale = (COACH_LENGTH / 2, COACH_WIDTH / 2, COACH_HEIGHT / 2)
    body.data.materials.append(create_material(f"{name}_BodyMat", color))

    # Roof
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, COACH_HEIGHT / 2 + ROOF_HEIGHT / 2))
    roof = bpy.context.active_object
    roof.name = f"{name}_Roof"
    roof.scale = ((COACH_LENGTH - 0.2) / 2, (COACH_WIDTH - 0.3) / 2, ROOF_HEIGHT / 2)
    roof.data.materials.append(create_material(f"{name}_RoofMat", (0.58, 0.64, 0.7, 1.0), metallic=0.4))

    # Underframe
    bpy.ops.mesh.primitive_cube_add(
        size=1,
        location=(0, 0, -COACH_HEIGHT / 2 - UNDERFRAME_HEIGHT / 2)
    )
    uf = bpy.context.active_object
    uf.name = f"{name}_Underframe"
    uf.scale = ((COACH_LENGTH - 1) / 2, (COACH_WIDTH - 0.5) / 2, UNDERFRAME_HEIGHT / 2)
    uf.data.materials.append(create_material(f"{name}_UfMat", (0.12, 0.16, 0.21, 1.0), metallic=0.5, roughness=0.7))

    # Windows
    win_mat = create_material(f"{name}_WindowMat", (0.12, 0.23, 0.37, 1.0), metallic=0.8, roughness=0.1)
    num_windows = config['windows']
    if num_windows > 0:
        spacing = (COACH_LENGTH - 4) / num_windows
        for i in range(num_windows):
            wx = -COACH_LENGTH / 2 + 2 + i * spacing + spacing / 2
            for side in [1, -1]:
                bpy.ops.mesh.primitive_cube_add(
                    size=1,
                    location=(wx, side * (COACH_WIDTH / 2 + 0.01), 0.3)
                )
                win = bpy.context.active_object
                win.name = f"{name}_Window_{i}_{'+' if side > 0 else '-'}"
                win.scale = (0.45, 0.005, 0.35)
                win.data.materials.append(win_mat)

    # Doors (2 per side)
    door_mat = create_material(f"{name}_DoorMat", (0.28, 0.33, 0.39, 1.0), metallic=0.3, roughness=0.5)
    for dx in [-COACH_LENGTH / 2 + 1.5, COACH_LENGTH / 2 - 1.5]:
        for side in [1, -1]:
            bpy.ops.mesh.primitive_cube_add(
                size=1,
                location=(dx, side * (COACH_WIDTH / 2 + 0.02), -0.3)
            )
            door = bpy.context.active_object
            door.name = f"{name}_Door_{int(dx)}_{'+' if side > 0 else '-'}"
            door.scale = (0.5, 0.005, 1.0)
            door.data.materials.append(door_mat)

    # Bogies
    bogie_mat = create_material(f"{name}_BogieMat", (0.12, 0.16, 0.21, 1.0), metallic=0.7, roughness=0.3)
    wheel_mat = create_material(f"{name}_WheelMat", (0.22, 0.25, 0.31, 1.0), metallic=0.9, roughness=0.2)
    
    for bx in [-BOGIE_OFFSET, BOGIE_OFFSET]:
        # Bogie frame
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(bx, 0, -COACH_HEIGHT / 2 - UNDERFRAME_HEIGHT - 0.3)
        )
        bogie = bpy.context.active_object
        bogie.name = f"{name}_Bogie_{int(bx)}"
        bogie.scale = (1.25, (COACH_WIDTH - 0.8) / 2, 0.15)
        bogie.data.materials.append(bogie_mat)

        # Wheels (4 per bogie, 2 visible per side)
        for wy in [-0.6, 0.6]:
            for ws in [COACH_WIDTH / 2 - 0.5, -(COACH_WIDTH / 2 - 0.5)]:
                bpy.ops.mesh.primitive_cylinder_add(
                    radius=0.45,
                    depth=0.1,
                    location=(bx + wy, ws, -COACH_HEIGHT / 2 - UNDERFRAME_HEIGHT - 0.5),
                    rotation=(math.pi / 2, 0, 0)
                )
                wheel = bpy.context.active_object
                wheel.name = f"{name}_Wheel"
                wheel.data.materials.append(wheel_mat)

    # White stripe
    stripe_mat = create_material(f"{name}_StripeMat", (0.97, 0.98, 0.99, 1.0), metallic=0.1, roughness=0.3)
    for side in [1, -1]:
        bpy.ops.mesh.primitive_cube_add(
            size=1,
            location=(0, side * (COACH_WIDTH / 2 + 0.02), -0.5)
        )
        stripe = bpy.context.active_object
        stripe.name = f"{name}_Stripe"
        stripe.scale = ((COACH_LENGTH - 0.5) / 2, 0.005, 0.075)
        stripe.data.materials.append(stripe_mat)

    # Select all and join
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    coach = bpy.context.active_object
    coach.name = name

    return coach


def create_berths_interior(config):
    """Create interior berths for sleeper/AC coaches."""
    name = config['name']
    berths = config['berths']
    bays = config['bays']
    
    if berths == 0:
        return None

    berth_mat_lb = create_material(f"{name}_BerthLB", (0.13, 0.77, 0.37, 1.0))
    berth_mat_mb = create_material(f"{name}_BerthMB", (0.92, 0.70, 0.03, 1.0))
    berth_mat_ub = create_material(f"{name}_BerthUB", (0.98, 0.45, 0.09, 1.0))
    berth_mat_sl = create_material(f"{name}_BerthSL", (0.23, 0.51, 0.95, 1.0))
    berth_mat_su = create_material(f"{name}_BerthSU", (0.02, 0.71, 0.82, 1.0))

    bay_length = (COACH_LENGTH - 4) / bays
    start_x = -COACH_LENGTH / 2 + 2

    objects = []
    berth_num = 1

    for bay in range(bays):
        bay_x = start_x + bay * bay_length + bay_length / 2

        # Main berths (left + right × 3 tiers)
        for side_z in [0.95, -0.95]:
            for deck, (y, mat) in enumerate([
                (0.05, berth_mat_lb),
                (0.72, berth_mat_mb),
                (1.35, berth_mat_ub),
            ]):
                if deck == 1 and berths <= 52:
                    continue  # AC 2-Tier: no middle berth

                bpy.ops.mesh.primitive_cube_add(
                    size=1,
                    location=(bay_x, side_z, y - COACH_HEIGHT / 2)
                )
                b = bpy.context.active_object
                b.name = f"{name}_Berth_{berth_num}"
                b.scale = (0.9, 0.3, 0.04)
                b.data.materials.append(mat)
                objects.append(b)
                berth_num += 1

        # Side berths
        for deck, (y, mat) in enumerate([
            (0.05, berth_mat_sl),
            (0.72, berth_mat_su),
        ]):
            bpy.ops.mesh.primitive_cube_add(
                size=1,
                location=(bay_x, -1.35, y - COACH_HEIGHT / 2)
            )
            b = bpy.context.active_object
            b.name = f"{name}_Berth_{berth_num}"
            b.scale = (0.5, 0.25, 0.04)
            b.data.materials.append(mat)
            objects.append(b)
            berth_num += 1

    return objects


def export_glb(name):
    """Export the scene to GLB format."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, f"{name}.glb")
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
    )
    print(f"Exported: {filepath}")


def main():
    """Generate all coach models."""
    print("=" * 60)
    print("Indian Railway Coach 3D Model Generator")
    print("=" * 60)

    for key, config in COACH_CONFIGS.items():
        print(f"\nGenerating: {config['name']}")
        clear_scene()
        create_coach_body(config)
        export_glb(config['name'])
        print(f"  ✓ {config['name']} exported")

    print("\n" + "=" * 60)
    print("All models generated successfully!")
    print(f"Output directory: {OUTPUT_DIR}")
    print("=" * 60)


if __name__ == '__main__':
    main()

