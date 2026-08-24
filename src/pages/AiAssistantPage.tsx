import { Link } from "react-router-dom";
import { ASSISTANT_FUNCTIONS } from "../lib/assistantFunctions.ts";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

export function AiAssistantPage() {
  const { t } = useI18n();

  return (
    <section className="page">
      <div className="page-header">
        <h1>{t.assistant.title}</h1>
      </div>
      <p className="page-lede">{t.assistant.lede}</p>

      <div className="function-grid">
        {ASSISTANT_FUNCTIONS.map((fn) => {
          const copy = t.assistant.functions[fn.id];
          return (
            <Link
              key={fn.id}
              className="function-card"
              to={`/ai-assistant/${fn.id}`}
            >
              <span className="function-card__rpc">{fn.rpc}</span>
              <h2>{copy.title}</h2>
              <p>{copy.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
