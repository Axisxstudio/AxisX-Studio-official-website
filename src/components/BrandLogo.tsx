import Image from "next/image";

type BrandLogoVariant = "lockup" | "mark";

type BrandLogoProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  variant?: BrandLogoVariant;
};

const assets: Record<
  BrandLogoVariant,
  { alt: string; height: number; sizes: string; src: string; width: number }
> = {
  lockup: {
    alt: "AxisX Studio logo",
    height: 241,
    sizes: "(max-width: 768px) 152px, 188px",
    src: "/logo-lockup.png",
    width: 956,
  },
  mark: {
    alt: "AxisX Studio mark",
    height: 230,
    sizes: "(max-width: 768px) 44px, 56px",
    src: "/logo-mark.png",
    width: 368,
  },
};

export default function BrandLogo({
  alt,
  className = "",
  priority = false,
  variant = "lockup",
}: BrandLogoProps) {
  const asset = assets[variant];

  return (
    <Image
      alt={alt ?? asset.alt}
      className={className}
      height={asset.height}
      priority={priority}
      sizes={asset.sizes}
      src={asset.src}
      width={asset.width}
    />
  );
}
