# Speak to Lichess 2.1 

Speak to Lichess is an open source Chrome extension that allows you to dictate moves on Lichess.org. It uses the Web Speech API to interpret voice data and the Lichess Board API to read the board state and submit moves. 

Full voice control- where your spoken moves are automatically played without further keyboard or mouse input- is available in Rapid, Classical, and Correspondence time formats. Blitz or faster time formats require some keyboard input and must be in SAN format (https://www.chessprogramming.org/Algebraic_Chess_Notation).

Supports standard games; alternative modes (such as crazyhouse, 'from position', etc.) should support UCI format moves, but are likely to incorrectly process SAN format moves (when submitting with the API).

Check out the 'Using this Extension' section to learn how to effectively dictate moves.

**The extension requires English piece names to properly recognize SAN format moves. However, you can use the word correction feature to add piece names in other languages. For example, a Spanish-speaking player could tell the extension that any time it hears 'torre' to instead interpret it as 'rook'. Better foreign language support could come in the future if there's enough interest.**

This extension is great for slower time formats and not-so-great for faster formats. It can be a great tool for blindfolded chess. Lichess provides move playback (in most browsers) so that you can hear each move played: enter a game and click on your name in the top right -> sound -> Speech.

Add from the Chrome Web Store here: https://chrome.google.com/webstore/detail/speak-to-lichess/ldiiocggpmgljihlkgpngjlhnggpapig

If you like the extension, give it a nice review!

### ---Learn more about the APIs used--- 

The Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

The Lichess Board API: https://lichess.org/blog/XlRW5REAAB8AUJJ-/welcome-lichess-boards

### ---Support Lichess.org---

https://lichess.org/help/contribute

### ---Downloads/Demos/Resources---

Install from the Chrome Web Store: https://chrome.google.com/webstore/detail/speak-to-lichess/ldiiocggpmgljihlkgpngjlhnggpapig 

2.1 Board State Tracking Demo: https://www.youtube.com/watch?v=V3aak7WYozs

2.0 Demo Showing most features (NOTE: Information regarding SAN vs UCI move submission out of date as of 2.1): https://www.youtube.com/watch?v=FB0uJwfo87k

Commands, SAN and UCI examples, and well-recognized words: https://docs.google.com/spreadsheets/d/1g6cGDRYvjGPj2gqeEMUVYwbZG3xjz_SrX_2q9z0Tsxo/edit?usp=sharing

Speak to Lichess is open source. Feedback welcome here on Github or at speak2lichess@gmail.com. If you'd like to contribute feel free to contact!

## Adding Your API Token

You will need to create a Lichess API token for true hands-free voice control (https://lichess.org/account/oauth/token). The options page of this extension will have a link directly to the token creation page with the correct parameters already set. Do not add any additional permissions when creating your token. Simply press the blue 'submit' button and copy the generated token. Return to the options page and paste in your token; then press 'enter' or the 'submit' button. The red icon will turn green if a valid token is provided, and you should see you your username.

The 'delete stored token' button will remove your token from the extension. 

NOTE, however, that the token is still valid for your Lichess account. If you feel your token has been compromised, make sure to delete it on Lichess as well: https://lichess.org/account/oauth/token

**--WARNING: Do not add additional permissions to your token! Token is stored in plain text!--**

Read more about the Lichess Board API here: https://lichess.org/blog/XlRW5REAAB8AUJJ-/welcome-lichess-boards

## Using this Extension

When getting started, play a rapid, classical, or correspondence game against the computer first to get a feel for the speech recognition and properly dictating moves. Be sure to read the 'Successful Dictation' section below.

The 'ctrl' key is used for either 'toggle' or 'push-to-talk' recording. You should see the message to the right of the board change to 'listening...' when the extension is recording. Clearly state your move. When you are finished speaking, the extension will attempt to create a valid chess move. You should see a 'success' or 'failure' message below the board. You can also view the console (f12) for more info.

Correctly interprets 'capture', 'take', 'short', 'long', 'castle', 'promote', and 'equals' into chess notation. Note that supplemental words such as 'capture' and 'promote' are not necessary.

**The word 'to' will always be interpreted as '2'; for example, 'knight to delta four' will ALWAYS be interpreted as 'N2d4'.**

## Successful Dictation

**To specify a column, you will have much more success saying a word that begins with that letter, such as 'delta' for the d column, than you will saying the actual letter. The speech processing service has a very difficult time discerning individual letters.**

Examples:

'Knight charlie 3' -> Nc3

'Delta four' -> d4

'Queen edge 7' -> Qe7

'fetch eight Queen' -> f8=Q

**Using words to represent column letters is NOT required. However you will likely have very mixed results.**

## Word Correction

You may come across a word that is frequently mistaken for another word by the recognition service. For example, 'rook' is almost always interpreted as 'Brooke'. The extension tracks a word-correction list to help provide a more consistent experience. ('Brooke' is already corrected by default)

Pin the extension to your Chrome toolbar, and click the icon to open the popup menu. Here you can specify the word that is giving you trouble and the word or phrase that you wish to be heard instead. In the options page you may view your corrected-words list, search for words being replaced/ being substituted in, and delete word entries. 

Users that wish to use a language other than English should be able to replace English piece names with piece names in their preferred language using word-correction. For example, a Spanish-speaking player could tell the extension that any time it hears 'torre', to instead interpret it as 'rook'. 

NOTE: You can use any word you want to identify a piece (e.g. 'noon' for knight, 'rail' for rook, etc.) with ONE exception: bishops. Any word that starts with 'b' other than 'bishop' will be interpreted as a pawn move; for example, 'bagel alpha four' will be interpreted as 'ba4' and is ALWAYS considered a pawn move- even if this is a legal move for your bishop. This arises because of the coordinate set and Bishop sharing the letter 'b' in notation. 

You can get around this by replacing your preferred word with 'bishop' in word correction; to use 'bagel', for example, you would tell the extension to interpret 'bagel' as 'bishop'.

*The extension comes preloaded with some problematic words already replaced (including 'Brooke').

Technical stuff/why word correction is necessary: The Web Speech API currently uses the SpeechGrammar interface (https://developer.mozilla.org/en-US/docs/Web/API/SpeechGrammar). This interface represents a set of words or patterns of words that the recognition service should look for specifically. This would allow us to set a list of well known words to represent columns and receive consistent recognition results. Unfortunately, the recognition service provided by Chrome ignores this list. See the 'Handling errors and unrecognized speech' section of this page: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API. 

More command examples, and words that are generally interpreted consistently, can be found here: https://docs.google.com/spreadsheets/d/1g6cGDRYvjGPj2gqeEMUVYwbZG3xjz_SrX_2q9z0Tsxo/edit?usp=sharing

## Text Input Box submission

For Blitz or faster formats, or if you cannot/prefer not to use an API token, you can use the Lichess text input box to submit moves. This requires that you press 'enter' to submit moves, and that your moves be in SAN format.

1. On Lichess, enable text input by going to https://lichess.org/account/preferences/game-behavior and enabling 'Input moves with the keyboard'

2. Make sure the extension is listening for your input using the 'ctrl' key. You should see the message to the right of the board change to 'Listening...'.

3. Dictate your move in SAN format. When you are finished, you should see the message near the input box display your move. Press enter to submit the displayed move to the input box, or dictate another move if the displayed move is incorrect.

## Additional Commands:

Other commands are support by this extension including:

resign

offer draw

take back

accept

decline

abort

rematch

flip board

analyze game

new game

rage quit

## Install Guide:

--Chrome Web Store (easiest): https://chrome.google.com/webstore/detail/speak-to-lichess/ldiiocggpmgljihlkgpngjlhnggpapig

--From Github:

1. Download the latest release zip file from GitHub (usually somewhere on the right of the page), or clone the repository. 

2. Unzip the package; take note of where the resulting folder is located. 

3. Go to chrome://extensions 

4. Toggle on developer mode in the top right, then click 'load unpacked' on the top left; select the 'Speech-to-Text-Lichess' folder that you extracted in step 2.

5. Done! You should see Speak to Lichess on your extension page. Make sure it is enabled. You will still need to add an API token in the options page.

6. At the top right of chrome, click the puzzle piece icon, and pin Speak to Lichess. This will let you use the pop up menu to specify words that the speech recognition software is mishearing and manage your list of replaced words. 

## Notes:

The Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

The Lichess Board API: https://lichess.org/blog/XlRW5REAAB8AUJJ-/welcome-lichess-boards, https://lichess.org/api#tag/Board 

Speak to Lichess is open source. Feedback welcome here on Github, or sent to speak2lichess@gmail.com. If you would like to contribute feel free to reach out!

If you like the app, give it a nice review on the Chrome Web Store!

### Known Issues/Other:

Some users have reported very poor recognition results. This all depends on how well the speech recognition service interprets your voice. To get the best results, make sure to articulate each component of your move clearly and distinctly. Keep trying different words until you find a set that the software recognizes consistently. And make use of the word correction feature.

The speech recognition service does offer alternative results, which will hopefully be used in the future to help more accurately interpret moves. 

I had plans to port this extension to Firefox, where I somehow got the impression that the SpeechGrammar interface would be correctly referenced as a vocabulary list. It turns out that Firefox does not support the Web Speech API's speech recognition service at the moment.
