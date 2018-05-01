#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
from google.appengine.ext import webapp
import webapp2
import logging
from webapp2_extras import routes
from google.appengine.api import users,urlfetch
import json
from functools import wraps
from collections import OrderedDict
import datetime
#from handlers import *
import pytz


def handle_404(request, response, exception):
    '''Page not found'''
    logging.exception(exception)
    with open('404.html') as html:
        response.write(html.read())
    response.set_status(404)

def handle_403(request, response, exception):
    '''Forbidden - unauthorised access'''
    logging.exception(exception)
    with open('403.html') as html:
        response.write(html.read())
    response.set_status(403)

class Jsonstr():
    def __init__(self, str):
        self.str = str

def ng_response(func):
    """
    This wraps all returning endpoints and ensures response matches the structure as per the API Spec
    """

    @wraps(func)
    def inner(self, *args, **kwargs):
        logging.debug("ng_response: started wrapping function call")
        self.response.content_type = 'application/json'
        response_data = None
        try:
            response_data = func(self, *args, **kwargs)
        except Exception as e:
            response = {'error': {'code': '-1', 'message': 'Unknown Error: {}'.format(e.message)}}
            logging.exception(e)
        else:
            response = {'ok': True, 'response': response_data}
        if isinstance(response_data, Jsonstr):
            response['response'] = json.loads(response_data.str, object_pairs_hook=OrderedDict)

        response = json.dumps(response)
        #response = json.dumps(response, cls=db.sql_alchemy_encoder(), check_circular=False)
        self.response.write(response)
        logging.debug("ng_response: finished wrapping function call")

    return inner
class MainHandler(webapp2.RequestHandler):


    def home(self):
        with open('client/dist/index.html') as html:
            self.response.write(html.read())

    @ng_response
    def getDataDetails(self,city,type, *args, **kwargs):
        try:
            response= {}
            web_user = users.get_current_user()
            query=''
            if(city=='all'):
                logging.info('no city')
            else:
                query = "&proximity={}".format(city.lower())
            if(type== 'all'):
                logging.info('no type')
            else:
                query = query+"&incident_type={}".format(type.lower())
            #url = "https://bikewise.org:443/api/v2/incidents?page=1&incident_type={}&proximity={}&proximity_square=1000&per_page=50".format(type.lower(),
            #                                                                                            city.lower());
            url = "https://bikewise.org:443/api/v2/incidents?page=1&proximity_square=1000&per_page=50{}".format(
                query);
            logging.info(url)
            fetch = urlfetch.fetch(url, deadline=60,validate_certificate=False);
            logging.info(fetch.content)
            if fetch.status_code == 200:
                response = json.loads(fetch.content)
                logging.info(response);
                type_list=[]
                for row in response['incidents']:
                    tz = pytz.timezone('Australia/Sydney')
                    occ_time = datetime.datetime.fromtimestamp(int(row['occurred_at']),tz);
                    if int(occ_time.minute) > 30:
                        rounded_time = self.round_minutes(occ_time, 'up', 60);
                    else:
                        rounded_time = self.round_minutes(occ_time, 'down', 30);

                    row['occurred_at'] = occ_time.strftime('%Y-%m-%d %H:%M:%S')
                    logging.info(row['occurred_at'])
                    if ([item for item in type_list if item.get('type')==row['type']]):
                        for list in type_list:
                            if list['type']==row['type']:
                                list['count']= list['count']+1;
                                if list['time_list'].has_key(rounded_time.hour):
                                    list['time_list'][rounded_time.hour] = list['time_list'][rounded_time.hour]+1
                                else:
                                    dict = {}
                                    dict[rounded_time.hour] = 1
                                    list['time_list'][rounded_time.hour]=1

                    else:
                        dict ={}
                        dict[rounded_time.hour]= 1

                        type_list.append({"type": row['type'], "count": 1, "time_list":dict});


                #response =json.dumps(response)
                result= self.findAvgTime(type_list)


            else:
                logging.info(" {} is not a store user : ".format(web_user.email()))
        except Exception as e:
            logging.exception(e);
        finally:
            return {"incidents":response,"summary":result}


    def round_minutes(self,dt, direction, resolution):
        new_minute = (dt.minute // resolution + (1 if direction == 'up' else 0)) * resolution
        return dt + datetime.timedelta(minutes=new_minute - dt.minute)

    def findAvgTime(self,list):
        for row in list:
            avg_time='{}:00'.format( min([k for k , v in row['time_list'].items() if v ==max(row['time_list'].values())]))
            row['avg_time']= avg_time
        return list
    def getDetails(self, *args, **kwargs):
        try:
            response= {}
            web_user = users.get_current_user()
            url = "https://bikewise.org:443/api/v2/incidents?page=1&incident_type={}&proximity={}&proximity_square=1000".format();
            logging.info(url)
            fetch = urlfetch.fetch(url, deadline=60);
            logging.info(fetch.content)
            if fetch.status_code == 200:
                response = json.loads(fetch.content)
                logging.info(response);

            else:
                logging.info(" {} is not a store user : ".format(web_user.email()))
        except Exception as e:
            logging.exception(e);
        finally:
            return response;




app = webapp2.WSGIApplication([
    webapp2.Route('/', MainHandler,handler_method="home", methods=['GET']),
    routes.PathPrefixRoute('/api', [
                webapp2.Route('/response/details/<city:.*>/<type:.*>',MainHandler,handler_method='getDataDetails',methods=['GET']),
                webapp2.Route('/response/getDetails',MainHandler,handler_method='getDetails',methods=['GET'])
                 ])

], debug=True)
