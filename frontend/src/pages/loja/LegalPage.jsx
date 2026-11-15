import { PageHero } from "../../components/common/PageHero.jsx";
import { PageMeta } from "../../components/common/PageMeta.jsx";
import { useStorefront } from "../../context/storefrontContext.js";
import { legalContent, seller, UPDATED_AT } from "./legalContent.js";

export function LegalPage({ type }) {
  const { mode } = useStorefront();
  const commerce = mode === "commerce";
  const page = legalContent(commerce)[type];
  return (
    <>
      <PageMeta title={page.title} description={page.description} />
      <PageHero eyebrow={page.label} title={page.title} text={page.intro} />
      <article className="legal-content container narrow">
        <p className="legal-status">
          Atualizada em {UPDATED_AT[commerce ? "commerce" : "catalog"]}. Responsável: {seller}.
        </p>
        {page.sections.map(([title, text]) => (
          <section key={title}>
            <h2>{title}</h2>
            {(Array.isArray(text) ? text : [text]).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </>
  );
}
