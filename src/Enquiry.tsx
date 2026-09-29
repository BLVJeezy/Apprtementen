import { useId, useState, type FormEvent } from "react";

type EnquiryProps = { apartment: string; salesEmail: string | null };

export default function Enquiry({ apartment, salesEmail }: EnquiryProps) {
  const id = useId();
  const [status, setStatus] = useState("");
  const recipient = salesEmail?.trim() ?? "";
  const hasRecipient = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const body = [
      "Beste,",
      "",
      `Ik ontvang graag meer informatie over ${apartment || "het project"}.`,
      "",
      String(data.get("message") ?? "").trim(),
      "",
      `Naam: ${String(data.get("name") ?? "").trim()}`,
      `E-mail: ${String(data.get("email") ?? "").trim()}`,
      `Telefoon: ${String(data.get("phone") ?? "").trim() || "Niet opgegeven"}`,
    ].join("\n");
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute(
      "value",
    );
    if (action === "email" && hasRecipient) {
      window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(`Informatieaanvraag — ${apartment || "het project"}`)}&body=${encodeURIComponent(body)}`;
      setStatus(
        "Niet verzonden. Uw e-mailprogramma wordt geopend met een concept. Controleer de inhoud en verzend de aanvraag zelf. Opent er niets? Download dan uw aanvraag.",
      );
      return;
    }
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "informatieaanvraag.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(
      hasRecipient
        ? "Niet verzonden. De download van uw aanvraag is gestart. U kunt het bestand zelf delen met het verkoopteam."
        : "Niet verzonden. De download van uw aanvraag is gestart. Er is nog geen verkoopcontact ingesteld; bewaar het bestand totdat een contactadres beschikbaar is.",
    );
  }

  return (
    <form
      className="enquiry-form"
      onSubmit={submit}
      onChange={() => setStatus("")}
      aria-describedby={`${id}-note`}
    >
      <p>
        Uw interesse: <strong>{apartment || "Het project"}</strong>
      </p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${id}-name`}>
            Naam <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            required
            maxLength={120}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-email`}>
            E-mailadres <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-phone`}>Telefoonnummer (optioneel)</label>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor={`${id}-message`}>
          Uw vraag <span aria-hidden="true">*</span>
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={4}
          required
          maxLength={3000}
          placeholder="Wat wilt u graag weten over deze woning?"
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-privacy`}>
          <input id={`${id}-privacy`} name="privacy" type="checkbox" required />{" "}
          Ik begrijp dat deze website mijn aanvraag alleen voorbereidt. Ik
          bepaal zelf of ik mijn contactgegevens met het verkoopteam deel. *
        </label>
      </div>
      <p className="form-note" id={`${id}-note`}>
        * Verplichte velden. Dit formulier slaat uw gegevens niet op en
        verstuurt niets automatisch.{" "}
        {hasRecipient
          ? "Open een e-mailconcept of download uw aanvraag. Een download bevat de door u ingevulde gegevens."
          : "Er is nog geen verkoopcontact ingesteld. U kunt uw aanvraag als tekstbestand downloaden; dit bestand bevat de door u ingevulde gegevens."}
      </p>
      <div className="form-grid">
        {hasRecipient && (
          <button className="button" type="submit" value="email">
            Open e-mail
          </button>
        )}
        <button
          className={hasRecipient ? "button button-secondary" : "button"}
          type="submit"
          value="download"
        >
          Download aanvraag
        </button>
      </div>
      <p className="form-status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}
