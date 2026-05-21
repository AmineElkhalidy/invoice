import { Dimensions, PixelRatio } from "react-native";

// Base design dimensions (iPhone X / standard design target)
const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Horizontal scale — scales linearly with screen width.
 * Use for horizontal paddings, margins, widths, border-radii, gaps.
 */
export const s = (size: number): number =>
  (SCREEN_WIDTH / DESIGN_WIDTH) * size;

/**
 * Vertical scale — scales linearly with screen height.
 * Use for vertical paddings, margins, heights, top/bottom offsets.
 */
export const vs = (size: number): number =>
  (SCREEN_HEIGHT / DESIGN_HEIGHT) * size;

/**
 * Moderate scale — scales less aggressively (default factor = 0.5).
 * Best for font sizes, icon sizes, and border-radii where you want
 * proportional growth but not 1:1 with screen width.
 */
export const ms = (size: number, factor: number = 0.5): number =>
  size + (s(size) - size) * factor;

/**
 * Screen dimensions for percentage-based layouts.
 */
export const screenWidth = SCREEN_WIDTH;
export const screenHeight = SCREEN_HEIGHT;

/**
 * Checks if device is a small screen (e.g. iPhone SE, older Androids)
 */
export const isSmallDevice = SCREEN_WIDTH < 375;

/**
 * Checks if device is a large screen (e.g. tablets, large phones)
 */
export const isLargeDevice = SCREEN_WIDTH >= 428;
