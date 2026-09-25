import { Sphere } from "./Sphere";
import * as styles from "./SphereLoader.css";

interface SphereLoaderProps {
  /** What is loading, shown under the sphere and announced to screen readers. */
  label: string;
  /** `md` for a page or a view, `sm` for a small frame. */
  size?: keyof typeof styles.size;
}

/** The sphere turning over what is loading, in the editor's colours. */
export function SphereLoader({ label, size = "md" }: SphereLoaderProps) {
  return (
    <div className={`${styles.root} ${styles.size[size]}`} role="status">
      <Sphere />
      <span>{label}</span>
    </div>
  );
}
