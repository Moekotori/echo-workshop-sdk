/**
 * This file is built in the author's own Node.js environment and runs only
 * after the subscriber approves desktop-application-equivalent access.
 *
 * @param {{ method: string, input?: unknown }} request
 * @param {{ pluginId: string, revision: string, contentRoot: string }} context
 */
export async function handle(request, context) {
  if (request.method === 'runtime-info') {
    return {
      pluginId: context.pluginId,
      revision: context.revision,
      node: process.versions.node,
      platform: process.platform,
      arch: process.arch,
    };
  }
  throw new Error(`Unknown trusted method: ${request.method}`);
}
