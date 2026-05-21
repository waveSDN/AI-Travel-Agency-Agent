const eventBus = require('../events/eventBus');
const logger = require('../utils/logger');

/**
 * Workflow Engine — declarative multi-step orchestration.
 *
 * A workflow is a sequence of steps. Each step can:
 *   • run a handler
 *   • read/write to a shared context
 *   • short-circuit (return { stop: true, result })
 *   • branch by name (return { next: 'stepName' })
 *
 * Workflows are pure data — easy to test, version, and visualize.
 */
class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
  }

  register(name, steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error(`Workflow "${name}" must have at least one step`);
    }
    this.workflows.set(name, steps);
    logger.info(`Workflow registered: ${name} (${steps.length} steps)`);
  }

  async run(workflowName, initialContext = {}) {
    const steps = this.workflows.get(workflowName);
    if (!steps) throw new Error(`Workflow not found: ${workflowName}`);

    const ctx = { ...initialContext, _trail: [] };
    const stepsByName = new Map(steps.map((s) => [s.name, s]));
    let current = steps[0];

    while (current) {
      const startedAt = Date.now();
      try {
        const result = await current.handler(ctx);
        const durationMs = Date.now() - startedAt;

        ctx._trail.push({ step: current.name, durationMs, ok: true });
        logger.debug(`Workflow "${workflowName}" → step "${current.name}" (${durationMs}ms)`);

        if (result?.stop) {
          return { ok: true, ctx, result: result.result, trail: ctx._trail };
        }
        if (result?.next) {
          current = stepsByName.get(result.next);
          if (!current) throw new Error(`Unknown next step: ${result.next}`);
          continue;
        }

        // Default: proceed to the next step in order
        const idx = steps.indexOf(current);
        current = steps[idx + 1] || null;
      } catch (err) {
        const durationMs = Date.now() - startedAt;
        ctx._trail.push({ step: current.name, durationMs, ok: false, error: err.message });
        eventBus.publish('error.occurred', {
          traceId: ctx.traceId,
          source: `workflow:${workflowName}:${current.name}`,
          error: err.message,
        });
        return { ok: false, error: err.message, ctx, trail: ctx._trail };
      }
    }

    return { ok: true, ctx, trail: ctx._trail };
  }

  list() {
    return [...this.workflows.keys()];
  }
}

const engine = new WorkflowEngine();
module.exports = engine;
