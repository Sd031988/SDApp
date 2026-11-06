# Opt-in Babylon distance culling adapter

This is a **real adapter to Babylon mesh methods**, not a claim that the active game has culling enabled. Call `SDGameDistanceCulling.create({near:80,far:100})`, explicitly `register(mesh)`, and pass `camera.globalPosition` or `camera.position` to `update()` once per frame. Call `dispose()` when the scene is unloaded.

- Uses Babylon `isEnabled()`, `setEnabled()` and `getAbsolutePosition()`. No scene traversal, no hidden global registration, no automatic engine changes.
- Hysteresis: hides beyond `far`, shows again inside `near`. It restores meshes hidden by the adapter on unregister/dispose.
- Initially disabled meshes are never enabled.
- **Ownership contract:** only register meshes whose enabled state this adapter exclusively controls while active. If another system concurrently changes `setEnabled()`, the adapter cannot distinguish ownership and may override it. Do not register Claude-owned/live game meshes without a reviewed integration.
- Distance culling of mesh origins is not frustum culling, occlusion culling, LOD or streaming. No measured GPU/CPU benefit claimed.
- Node tests use Babylon-compatible mocks. Browser/WebGL, mobile, asset import/export, renderer integration and visual regression **not tested**.
