import { Alert } from "@salnika/uipirate";

import { TEXT_FONTS } from "@lib/text/textFonts";

import { Prose } from "../components/Prose";
import { measure } from "../components/Prose.css";
import { Section } from "../components/Section";
import { PAGE_PATHS } from "../paths";
import { ETSY_SHOP_URL, REPO_URL, SITE_ORIGIN } from "../site";
import type { ContentPage } from "../types";

/**
 * The day these terms last changed. Change it with the text, and mention the change in the
 * changelog: the terms say both are where users learn of a change.
 */
const TERMS_UPDATED = "2026-10-15";

const SITE_HOST = new URL(SITE_ORIGIN).host;

function fontLicensePath(file: string): string {
  return `/${file.replace(/[^/]+$/, "OFL.txt")}`;
}

function Body() {
  return (
    <>
      <Section number="01" title="About these terms" kicker="SCOPE">
        <Prose>
          <p>
            These terms govern the use of Eurorack Panel Designer: the website at {SITE_HOST}, the
            editor it serves, and the files you export from it (together, “the service”). The
            service is published by a private individual in France (“we”, see the{" "}
            <a href="#legal-notice">legal notice</a>).
          </p>
          <p>
            By using the service, you accept these terms. If you do not accept them, do not use it.
          </p>
          <p>
            The source code of the editor is published <a href={REPO_URL}>on GitHub</a> under the
            MIT License, which applies to that code. These terms apply to the service published on
            this site and to what you make with it.
          </p>
        </Prose>
      </Section>

      <Section number="02" title="The service" kicker="FREE · AS IS">
        <Prose>
          <ul>
            <li>The service is free, needs no account, and runs in your browser.</li>
            <li>
              We may change, suspend or stop any part of it at any time, ordering included, without
              notice.
            </li>
            <li>
              We do our best to keep it working, but we do not promise that it is always available
              or free of errors.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section number="03" title="Your designs" kicker="YOURS">
        <Prose>
          <ul>
            <li>
              What you design stays yours. These terms give us no right to it, except what we need
              to make a panel you order (section 06).
            </li>
            <li>
              Your designs, projects and settings are kept in your browser’s storage, on your
              device. We do not receive them, except a design you send to order it. Clearing your
              browser’s data deletes them: export a JSON copy of the designs you want to keep.
            </li>
            <li>
              You are responsible for what you put in a design. The images, SVG files and text you
              import must be yours, or you must have the right to use them. Do not use the service
              for content that is illegal or that infringes the rights of others, such as the logo
              of another brand.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section number="04" title="Personal use only: no selling" kicker="COMMERCIAL USE">
        <Prose>
          <p>
            The service is offered free of charge for personal use. In return, you agree not to
            sell, rent or license, for money or for anything else of value:
          </p>
          <ul>
            <li>
              the files you export from the service (STL, SVG, PNG, KiCad and JSON files), or files
              made from them;
            </li>
            <li>
              panels, or any other object, made from those files or from a design made with the
              service, whether on their own or as part of a module, a kit, a case or any other
              product;
            </li>
            <li>
              a service built on it, such as printing, cutting or milling designs made with the
              service for other people.
            </li>
          </ul>
          <p>
            This applies wherever the sale takes place: in a shop, on a marketplace (Etsy, eBay,
            Tindie, Reverb…), on your own site, or at a meet-up.
          </p>
          <p>
            You may make panels for yourself, and share your design files free of charge, as long as
            the people you share them with follow these terms too.
          </p>
        </Prose>
        <Alert className={measure} tone="info" title="Panels ordered from the editor">
          The order button of the editor makes the panel for you: the RatpiSynth shop prints it and
          sells it to you on Etsy, which these terms allow. For any other commercial use, ask us
          first (section 12): we may allow it in writing.
        </Alert>
      </Section>

      <Section number="05" title="Fair use of the service" kicker="LIMITS">
        <Prose>
          <p>You may not:</p>
          <ul>
            <li>
              overload, attack or try to break into the service or the servers behind it, or get
              around its limits;
            </li>
            <li>
              send designs to the order system in bulk, by automated means, or for any other purpose
              than ordering a panel;
            </li>
            <li>present yourself as us, or a product as made or endorsed by us, when it is not.</li>
          </ul>
          <p>We may block access to the service for anyone who does.</p>
        </Prose>
      </Section>

      <Section number="06" title="Orders" kicker="ETSY">
        <Prose>
          <ul>
            <li>
              When ordering is open and you order a panel, the editor sends your design and the
              colours you picked to our server, which stores them under a design code. Anyone who
              has that code can open the design: only give it with your order.
            </li>
            <li>
              The sale itself takes place on Etsy, with the <a href={ETSY_SHOP_URL}>RatpiSynth</a>{" "}
              shop. Etsy’s terms and the conditions of the listing (price, shipping, returns) govern
              it, and Etsy handles your name, your address and your payment.
            </li>
            <li>
              We keep the design so the panel can be made, and made again if something goes wrong.
              Ask us to delete it once you have your panel.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section number="07" title="Check before you make anything" kicker="ACCURACY">
        <Prose>
          <p>
            The dimensions, hole sizes and part data of the service come from published standards
            and datasheets, but they can be wrong, out of date, or not match the parts you have.
            Exports are provided as they are.
          </p>
          <p>
            Before you cut, print or order anything, check the design against your parts, your case
            and your rails. We are not responsible for panels that do not fit, for materials or time
            lost, or for damage to your equipment.
          </p>
        </Prose>
      </Section>

      <Section number="08" title="Warranty and liability" kicker="AS IS">
        <Prose>
          <p>
            The service is provided free of charge and “as is”, without any warranty, express or
            implied, including that it fits a particular purpose. As far as the law allows, we are
            not liable for any loss or damage arising from its use or from being unable to use it,
            including the loss of designs kept in your browser.
          </p>
          <p>
            Nothing in these terms limits a liability that the law does not allow to be limited, nor
            the rights consumers hold under the law of the country they live in.
          </p>
        </Prose>
      </Section>

      <Section number="09" title="Privacy" kicker="DATA">
        <Prose>
          <p>
            The service has no account and sets no advertising or tracking cookie. What it keeps in
            your browser (designs, projects, settings, and a random identifier for error reports)
            stays on your device. Data leaves your browser in these cases only:
          </p>
          <ul>
            <li>
              <strong>Hosting.</strong> The site is served by Vercel, which processes your IP
              address and the requests of your browser to deliver the pages.
            </li>
            <li>
              <strong>Audience.</strong> The editor counts visits with Vercel Web Analytics, without
              cookies: it records the page, the referring site, the country, the browser and the
              type of device, and cannot tell who you are. The content pages, such as this one,
              count nothing.
            </li>
            <li>
              <strong>Error reports.</strong> When the editor runs into an error, it sends a report
              to Sentry, which stores it in the European Union (Germany): what went wrong, the
              address of the page, your browser, the random identifier, and a recording of the
              screen leading up to the error, with what you type in form fields masked. Reports go
              through our own server, so Sentry does not receive your IP address.
            </li>
            <li>
              <strong>Orders.</strong> The design and the colours you send, as section 06 describes.
            </li>
          </ul>
          <p>
            Audience and error reports rest on our legitimate interest in keeping the service
            working and knowing how it is used; orders rest on the order you place. We keep this
            data only as long as these purposes need it, we never sell it, and we use it for nothing
            else.
          </p>
          <p>
            Under the GDPR, you may ask to access, correct or delete your data, or object to its
            use, by contacting us (section 12). You may also lodge a complaint with the CNIL (
            <a href="https://www.cnil.fr/">cnil.fr</a>), or with the data protection authority of
            your country.
          </p>
        </Prose>
      </Section>

      <Section number="10" title="Fonts, parts and brands" kicker="THIRD PARTIES">
        <Prose>
          <ul>
            <li>
              The fonts offered for text are published by their designers under the SIL Open Font
              License 1.1, which allows using them in your panels:{" "}
              {TEXT_FONTS.map((font, index) => (
                <span key={font.id}>
                  {index > 0 ? ", " : null}
                  <a href={fontLicensePath(font.file)}>{font.familyName}</a>
                </span>
              ))}
              .
            </li>
            <li>
              Part sizes come from the datasheets of their makers, cited in the source code. Product
              and brand names (Eurorack, Doepfer, Intellijel, Pulp Logic, Kosmo, Thonkiconn,
              Switchcraft, Rean, Bourns, Etsy and others) belong to their owners. The service is not
              affiliated with or endorsed by any of them.
            </li>
          </ul>
        </Prose>
      </Section>

      <Section number="11" title="Changes to these terms" kicker="UPDATES">
        <Prose>
          <p>
            We may change these terms, for example when the service changes. The date at the top of
            this page says when they last changed, and the changelog of the editor mentions every
            change that matters. Using the service after a change means you accept the new terms.
          </p>
        </Prose>
      </Section>

      <Section number="12" title="Law, disputes and contact" kicker="CONTACT">
        <Prose>
          <p>
            These terms are governed by French law. If a dispute arises, contact us first so we can
            try to settle it amicably. Failing that, the French courts have jurisdiction, unless the
            law of your country lets you, as a consumer, go to your own courts.
          </p>
          <p>
            To contact us, send a message to the <a href={ETSY_SHOP_URL}>RatpiSynth shop</a> on
            Etsy, or, for anything that can be public, open an issue{" "}
            <a href={`${REPO_URL}/issues`}>on GitHub</a>.
          </p>
        </Prose>
      </Section>

      <Section id="legal-notice" number="13" title="Legal notice" kicker="PUBLISHER · HOST">
        <Prose>
          <ul>
            <li>
              Publisher and director of publication: a private individual in France, who publishes
              the service as a non-professional and, as French law allows (article 6 of the LCEN),
              keeps their identity private: the host holds it. Contact: see section 12.
            </li>
            <li>
              Host: Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, United States (
              <a href="https://vercel.com/">vercel.com</a>).
            </li>
          </ul>
        </Prose>
      </Section>
    </>
  );
}

export const termsPage: ContentPage = {
  path: PAGE_PATHS.terms,
  label: "Terms of use",
  group: "legal",
  title: "Terms of use | Eurorack Panel Designer",
  description:
    "Terms of use of Eurorack Panel Designer: free for personal use, no selling of exported " +
    "files or of panels made from them, privacy, and legal notice.",
  kicker: "LEGAL / TERMS OF USE",
  heading: "Terms of use",
  lead: (
    <>
      You may use Eurorack Panel Designer for free to design and make your own panels. You may{" "}
      <strong>not sell</strong> the files it exports, nor panels or any other object made from them.
    </>
  ),
  facts: [
    { label: "LAST UPDATED", value: TERMS_UPDATED },
    { label: "PERSONAL USE", value: "FREE" },
    { label: "SELLING", value: "NOT ALLOWED" },
    { label: "GOVERNING LAW", value: "FRANCE" },
  ],
  updated: TERMS_UPDATED,
  Body,
};
