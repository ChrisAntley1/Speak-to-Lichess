# Speak to Lichess 2.0

Play chess using speech recognition!

Lichess does not currently have a method to submit moves via voice commands. This extension allows you to dictate your moves and requires no board interaction. Great for blindfolded play or increasing accessibility. Not great for faster formats.

### NEW with 2.0 - Complete voice control with UCI format moves: Rapid, Classical, and Correspondence games supported!
### SAN format moves with some keyboard input required: All formats supported.

Demo: https://youtu.be/yqbm0kMNjAM

Chrome Web Store: https://chrome.google.com/webstore/detail/speak-to-lichess/ldiiocggpmgljihlkgpngjlhnggpapig 

Be sure to check out the How to Use section and example commands!

**Now supports complete voice control to submit moves in rapid, classical and correspondence time formats! Require UCI format moves. In addition, user must provide personal API token; instructions in options page.**

**Complete voice control AND UCI format moves are not supported in blitz or faster formats!**

**To specify the letter of a square, you must say a word that begins with that letter, such as "delta" for the d column. The dictation software is very bad at understanding individual letters!**

**Does not support the word "to"! Commands such as "bishop to hotel five" will be interpreted as "bishop 2 hotel 5", and will submit the move "b2h5".**

Takes advantage of Lichess's optional text input box for SAN format moves. SAN format requires user to press 'enter' to submit their move. 

Uses Lichess's Board API to (automatically!) submit UCI format moves in rapid, classical, and correspondence games. Requires API token which can be added in the options page.

Uses the Web Speech API to process spoken word into chess moves (with a little extra processing by the extension to more accurately recognize moves).

Demo: https://youtu.be/yqbm0kMNjAM

## Instructions

### SAN format moves, in any time format

1. On Lichess, enable text input by going to https://lichess.org/account/preferences/game-behavior and enabling "Input moves with the keyboard". Optional: to turn on move playback, enter a game and click on your name in the top right-> sound -> Speech.

2. Make sure the extension is listening for your input by holding the ctrl key. You should see the "Press and hold ctrl to dictate" message on the game page change to "Listening...". You can also switch to "toggle to listen" mode in the popup menu.

3. Say your move in SAN format. For pieces and numbers, simply say the piece or number. For the letter portion of a square's coordinates, say a word that starts with that letter; for example "Eric" for "e" or "delta" for "d". Trying to say the letter itself will likely fail and is not recommended! NOTE: you can also use this "word that starts with desired letter" method to specify pieces if needed.

4. The app will process your move and display it in SAN format below the text input box. Simply press enter to submit your move! If the move displayed is incorrect, you can try to dictate your command again, or you open the popup menu to see (and replace) the word that was incorrectly recognized. 

The popup menu will display your last spoken phrase as the speech software understood it (though slightly formatted). If the speech recognition software often hears a particular word that you are NOT trying to say, Speak to Lichess allows you to add this word to an exception list that will replace the word with the intended word or phrase. For example: tell the software to replace the word "ford" with "four". 

Speak to Lichess already replaces a number of words that cause issues (such as "ford"). You can view, edit, and add words to the Replacement List in the options page.

### SAN Command Guide:

SAN format moves can be used in any time control and do require the user to press 'enter' to submit.

Piece -> Word -> Number 

(Examples below this section)

To specify a square, say a word that starts with the letter of the coordinate you wish to specify followed by the number. For example, you could say "delta four" to specify the D4 square. The NATO phonetic alphabet is a great starting point for words that the speech recognition software consistently hears (I have run into a bit of trouble with 'foxtrot' though). Names also work well, ie "Frank six" to specify F6. 

"To" will always be interpreted as "2".

Correctly processes "capture", "take", "short", "long", "castle", "promote", "equals" into chess notation. User could theoretically add additional chess related words using the "replace words" feature.

More command info:
https://docs.google.com/spreadsheets/d/1g6cGDRYvjGPj2gqeEMUVYwbZG3xjz_SrX_2q9z0Tsxo/edit?usp=sharing

### Example SAN Commands:

"bobby four" -> b4

"queen charlie six" -> qc6

"night two gorilla seven" -> n2g7

"long castle" -> 0-0-0

"delta capture echo eight promote queen" dxe8=q

"offer draw" -> offers a draw to the opponent

### UCI format moves in rapid or slower games:

UCI commands are supported in rapid, classical, and correspondence time controls. Requires user to submit a personal API token in the options page; see instructions listed below example UCI commands.

UCI format specifies the square of the piece to be moved, and the square that piece should move to (a1c3). The format does not change if capturing a piece (e1e8 to capture a rook on e8 with your rook on e1). For castling, follow this format with the kings starting and ending squares (e1g1). For pawn promotions, add the promoting piece to the end of the regular format (e7e8q).

Word -> Number -> Word -> number

Specify squares in the same manner as you would for SAN format: a word that starts with the target letter, followed by the number. 

### Example UCI Commands:

"delta two delta four" -> d2d4

"baseball one charlie three" -> b1c3

"elephant eight computer eight" -> e8c8 (black queenside castle)

"gorilla seven fiesta eight queen" ->g7f8q (g7 pawn captures on f8 and promotes to queen)

### Enabling UCI format

A personal Lichess API token is required to use both automatic submission and UCI format. You can navigate, from the options page, to Lichess's personal token creation page. The name and required scope will already be set; do not add any unnecessary permissions. Simply press the blue 'submit' button, and copy the generated token into the appropriate field in Options, and submit.

## Warning: Do not add additional permissions to your token! Token is stored in plain text!

### Additional Commands:

"resign"
"offer draw"
"take back"
"accept"
"decline"
"abort"
"new game"
"rematch"
"flip board"
"analyze game"
"rage quit"

### Install Guide:

--Extension Store submission pending--

1. Download the latest release zip file from GitHub (usually somewhere on the right of the page) or clone the repository. 

2. Unzip the package; take note of where the resulting folder exists. 

3. Go to chrome://extensions 

4. Toggle on developer mode in the top right, then click 'load unpacked' on the top left; select the "Speech-to-Text-Lichess" folder that you extracted in step 2.

5. Done! You should see Speak to Lichess on your extension page. Make sure it is enabled.

6. At the top right of chrome, click the puzzle piece icon, and pin Speak to Lichess. This will let you use the pop up menu to specify words that the speech recognition software is mishearing and manage your list of replaced words. 

### Notes:

The Web Speech API (https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) is an experimental project. It is normally able to listen for sets of words supplied in the form of grammar objects. However this feature breaks when used in Chrome. As a result, the speech-to-text software often misinterprets the user's voice input. In addition, it seems most dictation software has a hard time discerning individual letters. For example, "B", "D", and "E" are often mistaken for one another. 

With that in mind, most of the work in this project focused on taking user input supplied by speech recognition; formatting it; replacing words that were most likely not what the user intended; and extracting chess moves from that resulting phrase.

The Lichess Board API (https://lichess.org/blog/XlRW5REAAB8AUJJ-/welcome-lichess-boards) allows this extension to communicate directly with Lichess to submit moves. The API accepts moves in UCI format and does not work in blitz or faster formats. 

For SAN format moves in the text box, the extension is unable to automatically fire an enter command in order to submit a move. Events fired programmatically and not from a real user event are marked as untrusted: https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted 

Speak to Lichess is Open Source. Feedback welcome!

### Known issues:

Some users have reported very poor recognition results; this will have to do with the speech recognition software. Until Speech Grammar works in chrome, this may be a persistent issue. The best advice I can give is to keep trying different words until you find a set that the software recognizes more consistently for you, and to make use of the word replacement feature. 
