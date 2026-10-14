import "./styles/index.css";
import { initUIRefs } from "./ui/refs.ts";
import { createGame } from "./game/controller.ts";
import { initSettings } from "./features/settings.ts";
import { initPip } from "./features/pip.ts";
import { initCredits } from "./features/credits.ts";

const refs = initUIRefs();
createGame(refs).start("easy");
initSettings(refs);
if (__FEATURE_PIP__) initPip(refs);
if (__FEATURE_CREDITS__) initCredits(refs);
