import { TOOLS, type ToolLink } from "./tools";

export interface ToolsShowcaseProps {
  tools?: ToolLink[];
}

export function ToolsShowcase({ tools = TOOLS }: ToolsShowcaseProps) {
  return (
    <section className="tools-showcase" aria-labelledby="tools-heading">
      <h2 id="tools-heading" className="tools-heading">
        Tools I've built
      </h2>
      <ul className="tools-list">
        {tools.map((tool) => (
          <li key={tool.href}>
            <a className="tool-card" href={tool.href}>
              <span className="tool-emoji" aria-hidden="true">
                {tool.emoji}
              </span>
              <span className="tool-text">
                <span className="tool-name">{tool.name}</span>
                <span className="tool-desc">{tool.description}</span>
              </span>
              <span className="tool-arrow" aria-hidden="true">
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
