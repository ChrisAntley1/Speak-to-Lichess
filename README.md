# Speech-to-Text-Lichess
dictate moves to lichess

Initial Release TODO:

Toggle options for user, such as: always listening toggle; 

Find an icon!

Allow users to choose different keybindings

Make sure full range of possible text commands is covered (draw offer, resign?, etc.); if not available, implement them by finding element resign/draw/takeback buttons in document!
--complete! simpler than expected!

Other/completed TODO:

Create options page to allow users to manage their replaced words.
--complete! though not pretty

Inform content script when the user adds another word to the replacement list from popup.
--complete! (i think)

Replace arrays of spelled out numbers, other word arrays with maps (probably).
--complete

Check the spoken phrase such that the iterable list of words can have trouble words replaced; especially
such that trouble words can be replaced by more than one word if needed.
--complete! 

Update "matches" in manifest so that script only runs on games (or at least a little more precisely).
--this seems more complicated than expected

Revisit Square-to-square moves.

Consider adding problem-word fields to lichess document body.

UCI format setting
--If we can't get Lichess to play nice with our current implementation.

Create option for user to change language; perhaps a new default trouble word set as well.

Learn how to format your own project, what to include in the published README, learn how to make a project open source.

Consider guiding images to help use extension effectively.
--Maybe a video?

Hide chess board for blind play? Like that dude's sweet chess.com extension.

from opensource.guide:

READMEs do more than explain how to use your project. They also explain why your project matters, and what your users can do with it.

In your README, try to answer the following questions:

What does this project do?
Why is this project useful?
How do I get started?
Where can I get more help, if I need it?
You can use your README to answer other questions, like how you handle contributions, what the goals of the project are, and information about licenses and attribution. If you don’t want to accept contributions, or your project is not yet ready for production, write this information down.


Initial release README:

An extension to facilitate dictating moves to Lichess. Takes advantage of text input to submit SAN format moves. Does require simple keyboard input. Uses the Web Speech API to process spoken word into chess moves (with a little extra processing by the extension to more accurately recognize moves).

Dictate your chess moves to Lichess! Great for blindfolded play or assisting with accessibility. Lichess does not currently have a method to submit moves via voice commands. This extension allows you to dictate your moves and requires no board interaction!*

*It does however require some keyboard input to submit moves.


How to use:

Download the extension from chrome's extension store, or:

Download this project; then go to chrome://extensions, toggle on developer mode in the top right, and click 'load unpacked' on the top left; select the "Speech-to-Text-Lichess" folder.

Quick steps:
1. On Lichess, enable text input by going to https://lichess.org/account/preferences/game-behavior and enabling "Input moves with the keyboard". Optional: to turn on move playback, enter a game and click on your name in the top right-> sound -> Speech. Necessary for blindfolded play!
2. Make sure the extension is listening for your input by either holding ctrl + space or by turning on continuous listening.
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
