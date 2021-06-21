# Speak to Lichess

Play chess using speech recognition!

Lichess does not currently have a method to submit moves via voice commands. This extension allows you to dictate your moves and requires no board interaction. Great for blindfolded play or increasing accessibility. 

Demo: https://youtu.be/yqbm0kMNjAM

Be sure to check out the How to Use section and example commands!

**DISCLAIMER: Speak to Lichess does require some keyboard input to submit moves and to record speech. In addition,  to specify the letter of a square, you must say a word that begins with that letter, such as "delta" for the d column. The dictation software is very bad at understanding individual letters!**

**Does not support the word "to"! Commands such as "bishop to hotel five" will be interpreted as "bishop 2 hotel 5", and will submit the move "b2h5".**

Takes advantage of Lichess's optional text input box to submit SAN format moves. Uses the Web Speech API to process spoken word into chess moves (with a little extra processing by the extension to more accurately recognize moves).

### Install Guide:

--Extension Store submission pending--

1. Download the latest release zip file from GitHub (usually somewhere on the right of the page) or clone the repository. 

2. Unzip the package; take note of where the resulting folder exists. 

3. Go to chrome://extensions 

4. Toggle on developer mode in the top right, then click 'load unpacked' on the top left; select the "Speech-to-Text-Lichess" folder that you extracted in step 2.

5. Done! You should see Speak to Lichess on your extension page. Make sure it is enabled.

6. Optional (but recommended!): At the top right of chrome, click the puzzle piece icon, and pin Speak to Lichess. This will let you use the pop up menu to specify words that the speech recognition software is mishearing and manage your list of replaced words. 

### How to Use:

Demo: https://youtu.be/yqbm0kMNjAM

1. On Lichess, enable text input by going to https://lichess.org/account/preferences/game-behavior and enabling "Input moves with the keyboard". Optional: to turn on move playback, enter a game and click on your name in the top right-> sound -> Speech.

2. Make sure the extension is listening for your input by holding the ctrl key. You should see the "Press and hold ctrl to dictate" message on the game page change to "Listening...". You can also switch to "toggle to listen" mode in the popup menu.

3. Say your move in SAN format. For pieces and numbers, simply say the piece or number. For the letter portion of a square's coordinates, say a word that starts with that letter; for example "Eric" for "e" or "delta" for "d". Trying to say the letter itself will likely fail and is not recommended! NOTE: you can also use this "word that starts with desired letter" method to specify pieces if needed.

4. The app will process your move and display it in SAN format below the text input box. Simply press enter to submit your move! If the move displayed is incorrect, you can try to dictate your command again, or you open the popup menu to see (and replace) the word that was incorrectly recognized. 

The popup menu will display your last spoken phrase as the speech software understood it (though slightly formatted). If the speech recognition software often hears a particular word that you are NOT trying to say, Speak to Lichess allows you to add this word to an exception list that will replace the word with the intended word or phrase. For example: tell the software to replace the word "ford" with "four". 

Speak to Lichess already replaces a number of words that cause issues (such as "ford"). You can view, edit, and add words to the Replacement List in the options page.

### Command Guide:

Piece -> Word -> Number 

(Examples below this section)

To specify a square, say a word that starts with the letter of the coordinate you wish to specify followed by the number. For example, you could say "delta four" to specify the D4 square. The NATO phonetic alphabet is a great starting point for words that the speech recognition software consistently hears (I have run into a bit of trouble with 'foxtrot' though). Names also work well, ie "Frank six" to specify F6. 

UCI format (*Square* to *square*) phrases will not be interpreted correctly! 

"To" will always be interpreted as "2".

Correctly processes "capture", "take", "short", "long", "castle", "promote", "equals" into chess notation. User could theoretically add additional chess related words using the "replace words" feature.

Additional, non-move commands supported:

"resign"
"offer draw"
"take back"
"accept"
"decline"
"abort"

More command info:
https://docs.google.com/spreadsheets/d/1g6cGDRYvjGPj2gqeEMUVYwbZG3xjz_SrX_2q9z0Tsxo/edit?usp=sharing

### Example Commands:

"bobby four" -> b4

"queen charlie six" -> qc6

"night two gorilla seven" -> n2g7

"long castle" -> 0-0-0

"delta capture echo eight promote queen" dxe8=q

"offer draw" -> offers a draw to the opponent

### Notes:

Web Speech API (https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) is an experimental project. It is normally able to listen for sets of words supplied in the form of grammar objects. However, this feature is broken in Chrome, and has been for a while. As a result, the speech-to-text software often misinterprets the user's voice input. In addition, it seems most dictation software has a hard time discerning individual letters. For example, "B", "D", and "E" are often mistaken for one another. 

With that in mind, most of the work in this project focused on taking user input supplied by speech recognition; formatting it; replacing words that were most likely not what the user intended; and extracting chess moves from that resulting phrase.

The app does not interact with Lichess's chessboard directly; it simply creates a text command and submits it to the move input box. It does interact with the "resign", "abort", "draw", etc. buttons. (See https://docs.google.com/spreadsheets/d/1g6cGDRYvjGPj2gqeEMUVYwbZG3xjz_SrX_2q9z0Tsxo/edit?usp=sharing)

My initial goal was to completely control the game with spoken word and require no keyboard input. However, the move input textbox does not automatically enter values without real keyboard input (Programmaticly triggering keyboard events failed to make the input box submit moves in my experience).

Hoping to implement the Lichess API in future updates to make Speak to Lichess completely voice controlled and hands free!

Speak to Lichess is Open Source. Feedback welcome!

### Known issues:

Some users have reported very poor recognition results; this will have to do with the speech recognition software. Until Speech Grammar works in chrome, this may be a persistent issue. The best advice I can give is to keep trying different words until you find a set that the software recognizes more consistently for you, and to make use of the word replacement feature. 