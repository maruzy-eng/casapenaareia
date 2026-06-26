import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  imageClassName?: string;
};

export function BrandLogo({
  href = "/",
  className = "",
  imageClassName = "",
}: BrandLogoProps) {
  return (
    <Link href={href} className={`flex items-center ${className}`}>
      <img
        src="https://casapenareia.com/wp-content/uploads/2026/06/LOGO-Casa-Pe-n%C2%B4Areia.png"
        alt="Casa Pé n’Areia"
        className={`h-11 w-auto max-w-[160px] object-contain sm:h-14 sm:max-w-[190px] ${imageClassName}`}
      />
    </Link>
  );
}