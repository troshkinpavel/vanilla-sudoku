import './style.css';
import { initUIRefs } from "./ui/refs.ts";
import { createGame } from "./game/controller.ts";
import { initPip } from "./ui/pip.ts";
import { initSettings } from "./ui/settings.ts";

const refs = initUIRefs();
createGame(refs).start("easy");
initPip(refs);
initSettings(refs);
