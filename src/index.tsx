import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  TextInput,
  View,
} from 'react-native';

interface Props extends React.ComponentProps<typeof ScrollView> {
  /** Additional height to be moved when scrolling when the keyboard is displayed. */
  additionalScrollHeight?: number;
}

/**
 * A customized ScrollView component that automatically adjusts the scroll position
 * when the keyboard is displayed. Ideal for forms and text entries that can be
 * obscured by the keyboard.
 *
 * @param {React.ReactNode} children - The content to be displayed within the ScrollView.
 * @param {number} [additionalScrollHeight] - Optional value to increase scrolling beyond the height of the keyboard.
 * @param {object} contentContainerStyle - Additional style applied to the contentContainer of the ScrollView.
 * @param {ScrollViewProps} props - The other properties of the ScrollView.
 *
 * @returns {JSX.Element} Returns a ScrollView component that manages scrolling automatically based on the keyboard.
 *
 * @example
 * ```tsx
 * <KeyboardScrollView additionalScrollHeight={20}>
 *   <TextInput placeholder="Digite seu nome" />
 * </KeyboardScrollView>
 * ```
 */
const KeyboardScrollView = ({
  children,
  additionalScrollHeight,
  contentContainerStyle,
  ...props
}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef<number>(0);
  const scrollContentSizeRef = useRef<number>(0);
  const scrollViewSizeRef = useRef<number>(0);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [additionalPadding, setAdditionalPadding] = useState(0);

  const scrollToPosition = useCallback(
    (toPosition: number, animated?: boolean) => {
      scrollViewRef.current?.scrollTo({ y: toPosition, animated: !!animated });
      scrollPositionRef.current = toPosition;
    },
    []
  );

  const additionalScroll = useMemo(
    () => additionalScrollHeight ?? 0,
    [additionalScrollHeight]
  );
  const androidStatusBarOffset = useMemo(
    () => StatusBar.currentHeight ?? 0,
    []
  );

  useEffect(() => {
    const didShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (frames) => {
        const keyboardY = frames.endCoordinates.screenY;
        const keyboardHeight = frames.endCoordinates.height;
        setAdditionalPadding(Math.ceil(keyboardHeight));

        setTimeout(() => {
          setIsKeyboardVisible(true);
        }, 100);

        const currentlyFocusedInput = TextInput.State.currentlyFocusedInput();
        const currentScrollY = scrollPositionRef.current;

        currentlyFocusedInput?.measureInWindow((_x, y, _width, height) => {
          const endOfInputY = y + height + androidStatusBarOffset;
          const deltaToScroll = endOfInputY - keyboardY;

          if (deltaToScroll < 0) {
            return;
          }

          const scrollPositionTarget =
            currentScrollY + deltaToScroll + additionalScroll;
          scrollToPosition(scrollPositionTarget, true);
        });
      }
    );

    const didHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (Platform.OS === 'android') {
        scrollToPosition(0, true);
      } else {
        const currentScrollY = scrollPositionRef.current;
        if (currentScrollY > 0) {
          scrollToPosition(currentScrollY - additionalPadding, true);
        }
      }

      setAdditionalPadding(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      didShowListener.remove();
      didHideListener.remove();
    };
  }, [additionalScroll, androidStatusBarOffset, scrollToPosition]);

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={[contentContainerStyle]}
      contentInset={{ bottom: additionalPadding }}
      keyboardShouldPersistTaps="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets
      onMomentumScrollEnd={(event) => {
        scrollPositionRef.current = event.nativeEvent.contentOffset.y;
      }}
      onScrollEndDrag={(event) => {
        scrollPositionRef.current = event.nativeEvent.contentOffset.y;
      }}
      onLayout={(event) => {
        scrollViewSizeRef.current = event.nativeEvent.layout.height;
      }}
      onContentSizeChange={(_width, height) => {
        const currentContentHeight = scrollContentSizeRef.current;
        const contentSizeDelta = height - currentContentHeight;
        scrollContentSizeRef.current = height;
        if (!isKeyboardVisible) {
          return;
        }
        const currentScrollY = scrollPositionRef.current;
        const scrollPositionTarget = currentScrollY + contentSizeDelta;
        scrollToPosition(scrollPositionTarget, true);
      }}
      {...props}
    >
      <View
        style={{ paddingBottom: Platform.OS === 'ios' ? 0 : additionalPadding }}
      >
        {children}
      </View>
    </ScrollView>
  );
};

export default KeyboardScrollView;
