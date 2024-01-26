# import TwitterClient as tb

from flask import Flask, request, jsonify
from UploadClient import uploadVideo
import json
import time
import urllib
import secrets, sys
import TwitterClient

# ============================================= CONSTANTS ======================================
BASEURL = "https://twitter.com/i/api/graphql/5V_dkq1jfalfiFOEZ4g47A/CreateTweet"
POLLURL = "https://caps.twitter.com/v2/cards/create.json"
REQUEST = ""
# =============================================UTILS ======================================
#function to construct request
def createCredentials(request):
    headers = {}
        
    headers["authorization"] = request.headers["authorization"]
    headers["x-csrf-token"] = request.headers["x-csrf-token"]
    headers["cookie"] = request.headers["cookie"]
    
    return headers

def createHeaders(request):
    headers = {}
        
    headers["authorization"] = request.headers["authorization"]
    headers["content-type"] = request.headers["content-type"]
    headers["x-csrf-token"] = request.headers["x-csrf-token"]
    headers["x-twitter-active-user"] = request.headers["x-twitter-active-user"]
    headers["x-twitter-auth-type"] = request.headers["x-twitter-auth-type"]
    headers["x-twitter-client-language"] = request.headers["x-twitter-client-language"]
    headers["cookie"] = request.headers["cookie"]
    
    return json.dumps(headers)

def create_request_string_poll(in_reply_to_tweet_id, card_uri):
    # Define the data structure for a poll
    tweet_text = "Please rate our Accuracy!"

    data = {
        "variables": {
            "tweet_text": tweet_text,
            "card_uri": card_uri,
            "reply": {
                "in_reply_to_tweet_id": in_reply_to_tweet_id,
                "exclude_reply_user_ids": []
            },
            "dark_request": False,
            "media": {
                "media_entities": [],
                "possibly_sensitive": False
            },
            "semantic_annotation_ids": []

        },
        "features": {
            "c9s_tweet_anatomy_moderator_badge_enabled": True,
            "tweetypie_unmention_optimization_enabled": True,
            "responsive_web_edit_tweet_api_enabled": True,
            "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
            "view_counts_everywhere_api_enabled": True,
            "longform_notetweets_consumption_enabled": True,
            "responsive_web_twitter_article_tweet_consumption_enabled": False,
            "tweet_awards_web_tipping_enabled": False,
            "responsive_web_home_pinned_timelines_enabled": True,
            "longform_notetweets_rich_text_read_enabled": True,
            "longform_notetweets_inline_media_enabled": True,
            "responsive_web_graphql_exclude_directive_enabled": True,
            "verified_phone_label_enabled": False,
            "freedom_of_speech_not_reach_fetch_enabled": True,
            "standardized_nudges_misinfo": True,
            "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
            "responsive_web_media_download_video_enabled": False,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
            "responsive_web_graphql_timeline_navigation_enabled": True,
            "responsive_web_enhance_cards_enabled": False
        },
        "queryId": "5V_dkq1jfalfiFOEZ4g47A"
    }

    # Convert the data to a JSON string
    request_string = json.dumps(data)

    # Format the string with escape characters
    formatted_string = request_string.replace('"', '\\"')
    return formatted_string
      
def create_request_string(in_reply_to_tweet_id, tweet_text, media_id):
    # Define the data structure
    data = {
        "variables": {
            "tweet_text": tweet_text,
            "reply": {
                "in_reply_to_tweet_id": in_reply_to_tweet_id,
                "exclude_reply_user_ids": []
            },
            "dark_request": False,
            "media": {
                "media_entities": [{"media_id": media_id, "tagged_users": []}],
                "possibly_sensitive": False
            },
            "semantic_annotation_ids": []
        },
        "features": {
            "c9s_tweet_anatomy_moderator_badge_enabled": True,
            "tweetypie_unmention_optimization_enabled": True,
            "responsive_web_edit_tweet_api_enabled": True,
            "graphql_is_translatable_rweb_tweet_is_translatable_enabled": True,
            "view_counts_everywhere_api_enabled": True,
            "longform_notetweets_consumption_enabled": True,
            "responsive_web_twitter_article_tweet_consumption_enabled": False,
            "tweet_awards_web_tipping_enabled": False,
            "responsive_web_home_pinned_timelines_enabled": True,
            "longform_notetweets_rich_text_read_enabled": True,
            "longform_notetweets_inline_media_enabled": True,
            "responsive_web_graphql_exclude_directive_enabled": True,
            "verified_phone_label_enabled": False,
            "freedom_of_speech_not_reach_fetch_enabled": True,
            "standardized_nudges_misinfo": True,
            "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": True,
            "responsive_web_media_download_video_enabled": False,
            "responsive_web_graphql_skip_user_profile_image_extensions_enabled": False,
            "responsive_web_graphql_timeline_navigation_enabled": True,
            "responsive_web_enhance_cards_enabled": False
        },
        "queryId": "5V_dkq1jfalfiFOEZ4g47A"
    }

    # Convert the data to a JSON string
    request_string = json.dumps(data)

    # Format the string with escape characters
    formatted_string = request_string.replace('"', '\\"')
    print("formatted string:", formatted_string)
    return formatted_string


def create_poll_body():
    payload = "card_data=%7B%22twitter%3Acard%22%3A%22poll4choice_text_only%22%2C%22twitter%3Aapi%3Aapi%3Aendpoint%22%3A%221%22%2C%22twitter%3Along%3Aduration_minutes%22%3A10080%2C%22twitter%3Astring%3Achoice1_label%22%3A%22Extremely Accurate%22%2C%22twitter%3Astring%3Achoice2_label%22%3A%22Accurate%22%2C%22twitter%3Astring%3Achoice3_label%22%3A%22Inaccurate%22%2C%22twitter%3Astring%3Achoice4_label%22%3A%22Extremely Inaccurate%22%7D"
    return payload

# Example usage:

def create_poll(bot, headers):
    body = create_poll_body()
    headers = json.loads(headers)
    headers["content-type"] = "application/x-www-form-urlencoded"
    headers = json.dumps(headers)
    
    print("poll headers", headers)
    fetch_command = "fetch(\""+ POLLURL + "\", { \"headers\" :" + headers +", \"body\" : \""+ body +"\", \"method\" : \"POST\", \"mode\": \"cors\", \"credentials\": \"include\"});"
    
    print("poll fetch command", fetch_command)
    
    video_script = f'''
        let res = await {fetch_command}
        let data = await res.json();
        return data;
    '''
    
    poll_data= bot.execute_script(video_script)
    print("Poll_info", poll_data)
    return poll_data['card_uri']
    
def postTweet(bot, request, in_reply_to, video_path):
    bot = bot.bot
    text = "Here's your translation! Download: https://sanitize.up.railway.app"
    media_id = uploadVideo(VIDEO_FILEPATH=video_path)
    
    print(media_id)
    
    # =========================== Constructing Translation Response Request =============================
    headers = createHeaders(request)
    body = create_request_string(in_reply_to, text, media_id)
    
    # =========================== CREATING TRANSLATION SCRIPTS =============================
    fetch_command = "fetch(\""+ BASEURL + "\", { \"headers\" :" + headers +", \"body\" : \""+ body +"\", \"method\" : \"POST\", \"mode\": \"cors\", \"credentials\": \"include\"});"
    video_script = f'''
        let res = await {fetch_command}
        let data = await res.json();
        return data;
    '''
    
    # =========================== POSTING TRANSLATION =============================
    video_data = bot.execute_script(video_script)
    print("videoData", video_data)
    response_id = video_data['data']['create_tweet']['tweet_results']['result']['rest_id']
    print("Executed! Response ID:", response_id) 
    
    
    # =========================== CONSTRUCTING POLL RESPONSE REQUEST =============================
    poll_id = create_poll(bot, headers)
    print("poll_id:", poll_id)
    body = create_request_string_poll(response_id, poll_id)

    # =========================== CREATING POLL SCRIPTS =============================
    fetch_command_poll = "fetch(\""+ BASEURL + "\", { \"headers\" :" + headers +", \"body\" : \""+ body +"\", \"method\" : \"POST\", \"mode\": \"cors\", \"credentials\": \"include\"});"
    poll_script = f'''
        let res = await {fetch_command_poll}
        let data = await res.json();
        return data;
    '''
    # =========================== POSTING POLL =============================
    print("fetch_command_poll", fetch_command_poll)
    poll_data = bot.execute_script(poll_script)
    print("poll_data", poll_data)
    poll_id = poll_data['data']['create_tweet']['tweet_results']['result']['rest_id']
    
    return {"responseId" : response_id, "pollId" : poll_id }

# ============================================= INITIALIZE BOT ======================================
CLIENT = TwitterClient.TwitterBot("","")
REQUEST = TwitterClient.init_client(CLIENT)

# ============================================= SERVER ======================================
app = Flask(__name__)

@app.route('/', methods=['GET'])
def home():
    return "home"
    

@app.route('/test', methods=['GET'])
def test():
    return "test"


    
@app.route('/postTranslation', methods=['POST'])
def postTranslation():
    result = ""
    try:
        data = request.get_json()

        # Extract task information from the received JSON
        in_reply_to = data.get('in_reply_to')
        video_path = data.get('video_path')

        print("in_reply_to", in_reply_to)
        print("video_path", video_path)
        # Perform tasks based on the task_type
        # bot.quit()
        
        result = postTweet(CLIENT, REQUEST, in_reply_to, video_path)

    except Exception as e:
        result = {'status': 'error', 'message': str(e)}

    return jsonify(result)

@app.route('/getCredentials', methods=['GET'])
def getCredentials():
    creds = createCredentials(REQUEST)
    print("creds:",creds)
    return jsonify(creds)

@app.route('/ping', methods=['GET'])
def ping():
    return "pong"

if __name__ == '__main__':
    app.run(host="0.0.0.0", port="5005")

