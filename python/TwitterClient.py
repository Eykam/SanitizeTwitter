from seleniumwire import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver import ActionChains
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry
'''Uncomment the below line when running in linux'''
from pyvirtualdisplay import Display
import time, os
 
TWITTER_URL = "https://twitter.com"
TWITTER_LOGIN_URL = "https://twitter.com/i/flow/login"
REMOTE_HOST = "http://selenium-browser:4444/wd/hub"
PROXY_SERVER = "71.178.10.195"

class TwitterBot:

    
    def __init__(self, email, password):
 
        """Constructor
 
        Arguments:
            email {string} -- registered twitter email
            password {string} -- password for the twitter account
        """
 
        self.email = email
        self.password = password
        # initializing chrome options
        chrome_options = Options()
        chrome_options.add_argument('--proxy-server=twitter-driver-container:4343')
        chrome_options.add_argument("user-data-dir=/home/selenium")
        chrome_options.add_argument('--profile-directory=Default')
        chrome_options.add_argument('ignore-certificate-errors')
        
        # chrome_options.add_argument(f'--proxy-server={PROXY_SERVER}')
				
        self.testChromeAvailable()
        self.bot = webdriver.Remote(command_executor=REMOTE_HOST,
        options=chrome_options, seleniumwire_options={
            'auto_config': False,
            'addr': '0.0.0.0',
            'port': 4343
        })
        
        # print ("Video: " + VIDEO_URL + driver.session_id)
 
    def testChromeAvailable(self):
        session = requests.Session()
        retry = Retry(connect=5, backoff_factor=0.5)
        adapter = HTTPAdapter(max_retries=retry)
        session.mount('http://', adapter)
        session.mount('https://', adapter)

        session.get(REMOTE_HOST)	 
 
 
    def refresh(self):
        bot = self.bot
        bot.refresh()
        
    def login(self):
        """
            Method for signing in the user 
            with the provided email and password.
        """
 
        bot = self.bot
        
        bot.get(TWITTER_LOGIN_URL)
        
        time.sleep(10)
       
        email = bot.find_element(By.XPATH, '//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[5]/label/div/div[2]/div/input').send_keys(self.email)
    
        next = bot.find_element(By.XPATH, '//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[6]/div').click()
        
        time.sleep(10)
        
        password = bot.find_element(By.XPATH, '//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[1]/div/div/div[3]/div/label/div/div[2]/div[1]/input').send_keys(self.password)
 
        time.sleep(3)
        
        login = bot.find_element(By.XPATH, '//*[@id="layers"]/div/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[1]/div/div/div/div').click()
        
        #check to see if successful then return true
        
    def get_mentions(self):
        bot = self.bot
        
        bot.get("https://twitter.com/notifications/mentions")
        
        bot.implicitly_wait(3)
        
        bot.get_log('browser')
    
    def get_twitter(self):
        bot = self.bot
        
        bot.get("twitter")
        
        bot.implicitly_wait(3)
    
    def quit(self):
        self.bot.quit()
        

def init_client(client):
    # mentions_url = "https://twitter.com/notifications/mentions"
    client.bot.get(TWITTER_URL)
    
    time.sleep(5)
    
    if "Sign in" in client.bot.page_source: #in the future check if not logged in, if not then log in
        client.login()

    time.sleep(10)

    REQUEST = ""
    
    for request in client.bot.requests:
        if "/HomeTimeline" in request.url or "HomeTimeline?" in request.url or "mentions.json?" in request.url:
            print("============================================")
            REQUEST = request
                
            print(f"Captured URL: {request.url}")
            break
                
           
    # client.quit()
    return REQUEST
        
   