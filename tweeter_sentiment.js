'use strict';

//SENTIMENTS, EMOTIONS, and SAMPLE_TWEETS have already been "imported"

/* Your script goes here */

// 1. A function to split up the tweet's text (a string) into individual words (an array).
function extract_word(string){
    var word_list=string.split(/\W+/);
    var i=0;
    var new_word_list=[];
    while (i<word_list.length) {
        var word=word_list[i];
        if (word.length>1){
            new_word_list.push(word.toLowerCase());
        }
        i++;
    }
return new_word_list;
}

// 2. A function that filters an array of words to only get those words that contain a specific emotion.
function emotion_filter(string,emotion){
    var filtered_list=[];
    var word_list=extract_word(string);
    for (var i=0;i<word_list.length;i++){
        var w=word_list[i];
        if(SENTIMENTS[w]!=undefined){
            if(SENTIMENTS[w][emotion]==1)
            {
                filtered_list.push(w)
            }
        }
    }
    return filtered_list;
}

// 3. A function that determines which words from an array have each emotion, returning an object that contains that information.
function dict_emotions(string){
    var dictionary={};
    for (var i=0;i<EMOTIONS.length;i++){
        dictionary[EMOTIONS[i]]=emotion_filter(string,EMOTIONS[i])
    }
    return dictionary;
}
 
// 4. A function that gets an array of the "most common" words in an array, ordered by their frequency.
function word_frequency(string_list){
    var word_dict={}
    for (var i=0;i<string_list.length;i++){
        if (word_dict[string_list[i]]!=undefined)
        {
            word_dict[string_list[i]]++;
        }
        else{
            word_dict[string_list[i]]=0;
        }
    }
    var keysSorted = Object.keys(word_dict).sort(function(a,b){return word_dict[b]-word_dict[a]})
    return keysSorted;
}
//console.log(word_frequency(['a','b','c','c','c','a']));

// 5. Optional: A function that takes in an array of tweet objects and returns an array of all the words included in those tweets.
function count_total_words(text_list){
    var l=text_list.reduce(function(a,b){return extract_word(a)+','+extract_word(b);})
    return l.split(',').length;
}

// Helper. Get tweets list
function get_tweet_list(SAMPLE_TWEETS){
    var tweet_list=[]
    for (var i=0;i<SAMPLE_TWEETS.length;i++){
        tweet_list.push(SAMPLE_TWEETS[i]["text"]);
    }
    return tweet_list;
}

// Helper. Get hashtag list, store into an object.
function get_hashtag_list(TWEETS){
    var hashtags=[];
    for (var i=0;i<TWEETS.length;i++){
        var tweet=TWEETS[i];
        if (tweet['entities']['hashtags']==[]){
            var emp='';
        }
        else{
            var temp=[];
            for (var j=0;j<tweet['entities']['hashtags'].length;j++) {
                temp.push('#'+tweet['entities']['hashtags'][j]['text'].toLowerCase());
            }
        }
        hashtags.push(temp)
    }
    return hashtags
}

// Vert similar to Func 6. (Optional), but different approach.
// A function (e.g., getEmotionHashtags()) that takes in two parameters: a tweet object and a single emotion (e.g., "happy").
//  This function will return an object of hashtags by this emotion.
function dict_emotions_hashtag(string,hashtag){
    var hash_dict=dict_emotions('');
    if (hashtag!=''){
        for (var i=0;i<EMOTIONS.length;i++){
            
            hash_dict[EMOTIONS[i]]=emotion_filter(string,EMOTIONS[i]);
            if (hash_dict[EMOTIONS[i]].length>0){
                hash_dict[EMOTIONS[i]]=hashtag;
            }
            else{
                hash_dict[EMOTIONS[i]]=[];
            }
        }
    }
    return hash_dict
 }

// 7. An analyzeTweets() function that takes in an array of tweets and returns an object containing the data of interest.
function analyze_tweets(SAMPLE_TWEETS){
    var tweet_list=get_tweet_list(SAMPLE_TWEETS);
    var hashtag_list=get_hashtag_list(SAMPLE_TWEETS);
    var num_total_words=count_total_words(tweet_list);

    var dict_words=dict_emotions('');
    var dict_hashs=dict_emotions('');
    for (var i=0;i<tweet_list.length;i++){
        var dict_emotion=dict_emotions(tweet_list[i]);
        var dict_emotion_hashtag=dict_emotions_hashtag(tweet_list[i],hashtag_list[i]);
        for(var j=0;j<EMOTIONS.length;j++){
            var temp=dict_words[EMOTIONS[j]];
            dict_words[EMOTIONS[j]]=temp.concat(dict_emotion[EMOTIONS[j]]);
            var temp_hash=dict_hashs[EMOTIONS[j]];
            dict_hashs[EMOTIONS[j]]=temp_hash.concat(dict_emotion_hashtag[EMOTIONS[j]]);
        }
    }
    var data=dict_emotions('');
    for (var i=0;i<EMOTIONS.length;i++){
        data[EMOTIONS[i]]["emotion"]=EMOTIONS[i];
        data[EMOTIONS[i]]["percentage"]=dict_words[EMOTIONS[i]].length/num_total_words;
        data[EMOTIONS[i]]["example_words"]=word_frequency(dict_words[EMOTIONS[i]]).slice(0, 3);
        data[EMOTIONS[i]]["hashtags"]=word_frequency(dict_hashs[EMOTIONS[i]]).slice(0, 3);

    }
    var dict_word_freq=dict_emotions('');
    var dict_hash_freq=dict_emotions('');
    var table_dict={};
    var d=Object.values(data);
    
    return d.sort(function(x, y){return d3.descending(x.percentage, y.percentage);});
}
//console.log(analyze_tweets(SAMPLE_TWEETS))

// Displaying the Statistics
function show_emotion_data(TWEETS,count=SAMPLE_TWEETS.length){
    // run the code above
    var data=analyze_tweets(TWEETS)
    // build html table object
    var table = d3.select("#emotionsTableContent");
    table.html('');
    for (var i=0;i<data.length;i++){
        var tr='';
        var new_row=table.append('tr');
        tr+='<td>'+data[i]['emotion']+'</td>';
        tr+='<td>'+(data[i]['percentage']*100).toFixed(2)+'%</td>';
        tr+='<td>'+data[i]['example_words'].join(', ')+'</td>';
        tr+='<td>'+data[i]['hashtags'].join(', ')+'</td>';
        new_row.html(tr);
    }
    var ct=table.append('p');
    ct.text('# of Tweets: '+count);
}

// Call API,download data
async function download_and_analyze(){
    var UserName=d3.select('#searchBox').property('value');
    var count=200;
    d3.select("#emotionsTableContent").text('Please wait...');
    var tweets=await fetch('https://faculty.washington.edu/joelross/proxy/twitter/timeline/?screen_name='+UserName+'&count='+count).then(response=>response.json());
    if (tweets[0]==undefined){
        var table = d3.select("#emotionsTableContent");
        table.text('Sorry, there is no such user.')
    }
    else{
        show_emotion_data(tweets,count);
    }

}

//show default SAMPLE_TWEETS data
show_emotion_data(SAMPLE_TWEETS);
d3.select("#emotionsTableContent").append('p').text('*Teseted on Chrome and FireFox.')
d3.select("#emotionsTableContent").append('p').text('**Local Web Server Not Needed.')
// button settings
var button=d3.select("#searchButton");
button.on("click",function(){
    download_and_analyze();
});


