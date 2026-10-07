import { useState } from "react";
import { Typography, Button, Box } from "@mui/material";
import { t } from "i18next";

const ExpandableText = ({ text, length = 8 }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = (event) => {
    event.stopPropagation(); // Prevents click from affecting parent elements
    setExpanded(!expanded);
  };

  // Function to limit the text to 8 words
  const getShortText = (text) => {
    const words = text?.split(" ");
    if (words?.length > length) {
      return words.slice(0, length).join(" ") + " ...";
    }
    return text;
  };

  return (
    <Box>
      <Typography
        variant="body1"
        sx={{
          display: "inline",
          fontSize: 14,
        }}
      >
        {expanded ? text : getShortText(text)}
      </Typography>
      {text?.split(" ").length > length && (
        <Box
          onClick={handleToggle}
          sx={{
            cursor: 'pointer',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          <p style={{ fontSize: "12px" }}>
            {expanded ? t("show_less") : t("show_more")}
          </p>

        </Box>
      )}
    </Box>
  );
};

export default ExpandableText;
