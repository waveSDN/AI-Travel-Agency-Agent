const eventBus = require('../events/eventBus');
const logger = require('../utils/logger');

/**
 * Tool Registry — modern agent-style tool management.
 *
 * Each tool is registered with:
 *   • name        — unique identifier
 *   • description — natural-language description used by the LLM
 *   • parameters  — JSON Schema describing inputs
 *   • handler     — async function that executes the tool
 *
 * The registry is the SINGLE source of truth for tools. The agent never
 * imports tool implementations directly — it asks the registry.
 *
 * This shape is intentionally compatible with Anthropic's tool-use API.
 */
class ToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(definition) {
    const { name, description, parameters, handler } = definition;
    if (!name || !description || !handler) {
      throw new Error(`Invalid tool registration: name, description, handler required (got ${name})`);
    }
    if (this.tools.has(name)) {
      logger.warn(`Tool "${name}" is being re-registered`);
    }
    this.tools.set(name, { name, description, parameters: parameters || {}, handler });
    logger.info(`Tool registered: ${name}`);
  }

  unregister(name) {
    this.tools.delete(name);
  }

  has(name) {
    return this.tools.has(name);
  }

  get(name) {
    return this.tools.get(name);
  }

  list() {
    return [...this.tools.values()];
  }

  /**
   * Returns tool definitions in Anthropic tool-use format.
   * Use this when sending tools to Claude.
   */
  toAnthropicTools() {
    return this.list().map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }

  /**
   * Executes a tool by name, with tracing + event emission.
   * Returns the raw result from the handler.
   */
  async invoke(name, args, ctx = {}) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);

    const traceId = ctx.traceId;
    const startedAt = Date.now();

    eventBus.publish('tool.called', { traceId, tool: name, args });

    try {
      const result = await tool.handler(args, ctx);
      const latencyMs = Date.now() - startedAt;
      eventBus.publish('tool.completed', { traceId, tool: name, latencyMs });
      return { ok: true, result, latencyMs };
    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      eventBus.publish('tool.failed', { traceId, tool: name, error: err.message, latencyMs });
      logger.error(`Tool "${name}" failed: ${err.message}`);
      return { ok: false, error: err.message, latencyMs };
    }
  }
}

const registry = new ToolRegistry();
module.exports = registry;
