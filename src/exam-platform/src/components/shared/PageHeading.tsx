import React from "react";

export default function PageHeading({ heading }: { heading: string }) {
  return <h1 className="text-[26px] font-bold tracking-tight">{heading}</h1>;
}
