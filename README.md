# Speak to Lichess

## Dictate your chess moves to Lichess!

Lichess does not currently have a method to submit moves via voice commands. This extension allows you to dictate your moves and requires no board interaction. Great for blindfolded play or increasing accessibility. 

Be sure to check out the How to Use section and example commands!

**IMPORTANT: Speak to Lichess does require some keyboard input to submit moves and to record speech. In addition,  to specify the letter of a square, you must say a word that begins with that letter, such as "delta" for the d column. The dictation software is very bad at understanding individual letters!**

**Does not support the word "to"! Commands such as "bishop to hotel five" will be interpreted as "bishop 2 hotel 5", and will submit the move "b2h5".**

Takes advantage of Lichess's optional text input box to submit SAN format moves. Uses the Web Speech API to process spoken word into chess moves (with a little extra processing by the extension to more accurately recognize moves).

How to use:

Download the extension from chrome's extension store (PENDING), or:

Download this project; then go to chrome://extensions, toggle on developer mode in the top right, and click 'load unpacked' on the top left; select the "Speech-to-Text-Lichess" folder.

### How to Use:


Demo: https://youtu.be/yqbm0kMNjAM

1. On Lichess, enable text input by going to https://lichess.org/account/preferences/game-behavior and enabling "Input moves with the keyboard". Optional: to turn on move playback, enter a game and click on your name in the top right-> sound -> Speech.

2. Make sure the extension is listening for your input by either holding ctrl or by turning on toggle listening in the popup menu (upper right of chrome, click the puzzle piece icon, find Speak to Lichess in the extension list, and pin it. then click the Speak to Lichess icon to view the popup menu).

3. Say your move in SAN format. For the letter portion a square's coordinates, say a word that starts with that letter; for example "Eric" for "e" or "delta" for "d". Trying to say the letter itself will most likely be misinterpreted and is not recommended!

4. The app will process your move and display it in SAN format below the text input box. Simply press enter to submit your move! If the move displayed is incorrect, you can try to dictate your command again, or click the icon in your browser to see (and possibly replace) the word that was incorrectly recognized. 

The popup menu will display your last spoken phrase as the speech software understood it (though slightly formatted). If the speech recognition software often hears a particular word that you are NOT trying to say, Speak to Lichess allows you to add this word to an exception list that will replace the word with the intended word or phrase. 

Options page displays your entire exception list and allows adding, editing, and removing words. 

Comes with a predefined list of words to replace that can be edited or removed in the options page. The list of words is stored in Chrome's local storage.

### Command Guide:
To specify a square, say a word that starts with the letter of the coordinate you wish to specify followed by the number. For example, you could say "Delta four" to specify the D4 square. The NATO phonetic alphabet is a great starting point for words that the speech recognition software consistently hears (I have run into a bit of trouble with 'foxtrot' though). Names also work well, ie "Frank six" to specify F6. 

*Piece* to *square* phrases will not be interpreted correctly! "To" will always be reinterpreted as "2".

Correctly processes "capture", "short", "long", "castle", "promote", "equals" into chess notation. User could theoretically add additional chess related words they wish to use.

Additional, non-chess-move commands the user can also use:

"resign"
"offer draw"
"take back"
"accept"
"decline"
"abort"

More command info:
https://bit.ly/3q7qtNV

### Example Commands:

"Beta four" -> b4

"Queen charlie six" -> qc6

"Night two golf seven" -> n2g7

"long castle" -> 0-0-0

"delta capture echo eight promote queen" dxe8=q

"offer draw" -> offers a draw to the opponent

### Notes:

Web Speech API (https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) is an experimental project and is able to listen for sets of words supplied in the form of grammar objects. However, this feature is broken in Chrome and has been for a while. As a result, the speech-to-text software often misinterprets the user's voice input. In addition, it seems most dictation software has a hard time discerning individual letters. For example, "B", "D", and "E" are often mistaken for one another. 

With that in mind, much of this project involved:

1. Processing user input supplied by the web speech API to reinterpret commonly misheard words; and
2. Figuring out an easy way to specify square coordinates without having to say the letter.

The app does not interact with Lichess's chessboard directly; it simply creates a text command and submits it to the move input box. It does interact with the "resign", "abort", "draw", etc. buttons. (See https://bit.ly/3q7qtNV)

My initial goal was to completely control the game with spoken word and require no keyboard input. However, the move input textbox does not automatically enter values without real keyboard input (Programmaticly triggering keyboard events failed to make the input box submit moves in my experience).

Speak to Lichess is Open Source.

### Known issues:

Holding the ctrl key while 'toggle' is set will set off a lot of errors. 

Some users have reported very poor recognition results; this will have to do with the speech recognition software. Until Speech Grammar works in chrome, this may be a persistent issue. The best advice I can give is to keep trying different words until you find a set that the software recognizes more consistently for you, and to make use of the word replacement feature. 