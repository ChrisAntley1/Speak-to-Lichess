Speak to Lichess

An extension to facilitate dictating moves to Lichess. Takes advantage of text input to submit SAN format moves. Does require simple keyboard input. Uses the Web Speech API to process spoken word into chess moves (with a little extra processing by the extension to more accurately recognize moves).

Dictate your chess moves to Lichess! Great for blindfolded play or assisting with accessibility. Lichess does not currently have a method to submit moves via voice commands. This extension allows you to dictate your moves and requires no board interaction!*

*It does however require some keyboard input to submit moves.


How to use:

Download the extension from chrome's extension store, or:

Download this project; then go to chrome://extensions, toggle on developer mode in the top right, and click 'load unpacked' on the top left; select the "Speech-to-Text-Lichess" folder.

Quick steps:
1. On Lichess, enable text input by going to https://lichess.org/account/preferences/game-behavior and enabling "Input moves with the keyboard". Optional: to turn on move playback, enter a game and click on your name in the top right-> sound -> Speech. Necessary for blindfolded play!
2. Make sure the extension is listening for your input by either holding ctrl or by turning on toggle listening in the popup menu (upper right of chrome, click the puzzle piece icon, find Speak to Lichess in the list, and pin it. then click the Speak to Lichess icon to view the popup menu).
3. Say your move in SAN format. For the letter portion a square's coordinates, say a word that starts with that letter; the letter itself will most likely be misinterpreted!
4. The app will process your move and display it in SAN format below the text input box. If it is the command you were describing, press enter to submit it! If not, you may try to dictate your command again, or click the icon in your browser to see (and possibly replace) the word that was incorrectly recognized. 
Accepts input in Standard Algebraic Notation (SAN)*. 

In addition, the popup menu will display your last spoken phrase as the speech software understood it. If the speech recognition software often hears a particular word that you are NOT trying to say, the extension allows you to add this word to an exception list that will replace the word with the intended word or phrase (as set by you). 

Options page displays your entire exception list and allows adding, editing, and removing words. 

To specify a square, say a word that starts with the letter of the coordinate you wish to specify followed by the number. For example, you could say "Delta four" to specify the D4 square. The NATO phonetic alphabet is a great starting point for words that the speech recognition software consistently hears (I have run into a bit of trouble with 'foxtrot' though). Names also work well, ie "Frank six" to specify F6. 

Correctly processes "capture", "short", "long", "castle", "promote", "equals" into chess notation. User could theoretically add additional chess related words they wish to use.

IMPORTANT NOTE: Does not support the word "to"! Commands such as "bishop to hotel five" will be interpreted as "bishop 2 hotel 5", and will submit the move "b2h5".

Can also resign, offer a draw or take-back, accept/decline a draw or take-back, and abort games!

Some example commands:

"Beta four" -> b4

"Queen charlie six" -> qc6

"Night two golf seven" -> n2g7

"long castle" -> 0-0-0

"delta capture echo eight promote queen" dxe8=q

"offer draw" -> offers a draw to the opponent

*NOTE: the extension is capable of interpreting and submitting UCI format commands; however, Lichess doesn't accept the entire move at once. It expects 1 square after the other; I have attempted to submit UCI format coordinates in this manner, but Lichess fails to accept the 2nd coordinate (except with pawns).

Notes about the app:

Web Speech API is an experimental project and is supposed to be able to listen for set of words in the form of a grammar object. However,
as far as I could tell, this is broken when used with chrome for reasons. As a result, the speech-to-text software often misinterprets
the user's voice input. In addition, it seems most dictation software has a hard time discerning individual letters. For example, "B", "D", and "E" are often mistaken for one another. 

As a result, a large part of this project was:

1. Figuring out common mistakes the dictation software makes, and allowing the user to specify words they don't mean; and
2. Figuring out an easy way to specify square coordinates without having to say the letter.

The app does not interact with Lichess's chessboard directly; it simply creates a text command and submits it to the move input box. 

My initial goal was to completely control the game with spoken word and require no keyboard input. However, the move input textbox does not automatically enter values without keyboard input of some kind (even simulated 'enter' events).

Comes with a predefined list of words to replace that can be edited or removed in the options page. The list of words is stored in chrome.storage.local.
