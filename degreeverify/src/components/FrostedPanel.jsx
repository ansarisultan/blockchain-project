export default function FrostedPanel({
  as: Tag = "section",
  className = "",
  children,
  size = "md",
  ...rest
}) {
  const sizeClass = size === "lg" ? "frosted-panel-lg" : "frosted-panel";
  return (
    <Tag className={`${sizeClass} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
