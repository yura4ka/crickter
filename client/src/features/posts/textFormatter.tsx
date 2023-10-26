import React from "react";
import { Link } from "react-router-dom";

const hashtagRegex = /#(\w+)/;
const linkRegex = /(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*/;

export function formatText(text: string) {
  return text.split("\n").map((r, j) => (
    <p key={j}>
      {r.split(" ").map((s, i) => {
        const tag = s.match(hashtagRegex);
        if (tag)
          return (
            <React.Fragment key={i}>
              <Link to={`/tags/${tag[1].toLowerCase()}`} className="link">
                {s}
              </Link>{" "}
            </React.Fragment>
          );

        const url = s.match(linkRegex);
        if (url)
          return (
            <React.Fragment key={i}>
              <Link to={url[0]} target="__blank" className="link">
                {s}
              </Link>{" "}
            </React.Fragment>
          );
        if (r === "")
          return (
            <React.Fragment key={i}>
              <br />
            </React.Fragment>
          );
        return <React.Fragment key={i}>{s} </React.Fragment>;
      })}
    </p>
  ));
}
