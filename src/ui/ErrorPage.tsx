import { uiPageTitle } from "./styles/editableStyles";

export function ErrorPage({ title }: { title: string }) {
  return (
    <div role="alert" className="py-10">
      <h1 className={uiPageTitle}>{title}</h1>
    </div>
  );
}
