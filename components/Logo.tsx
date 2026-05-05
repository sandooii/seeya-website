import Image from "next/image";

type Props = {
  className?: string;
  /** Pixel height; image scales proportionally via object-contain */
  size?: number;
  priority?: boolean;
  /** Which logo file to use */
  variant?: "white" | "pink";
};

export default function Logo({
  className = "",
  size = 48,
  priority = false,
  variant = "pink",
}: Props) {
  const src = variant === "white" ? "/logo-white.png" : "/logo-pink.png";
  return (
    <Image
      src={src}
      alt="SeeYa"
      width={120}
      height={120}
      priority={priority}
      className={`object-contain w-auto ${className}`}
      style={{ height: `${size}px` }}
    />
  );
}
