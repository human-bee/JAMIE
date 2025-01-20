Token Usage:
GitHub Tokens: 14665
LLM Input Tokens: 0
LLM Output Tokens: 0
Total Tokens: 14665

FileTree:
integuru/main.py
integuru/init.py
integuru/graph_builder.py
integuru/main.py
integuru/agent.py
.gitignore
create_har.py
README.md
.github/workflows/ci.yml
integuru/models/DAGManager.py
integuru/models/request.py
integuru/util/LLM.py
integuru/util/har_processing.py
integuru/models/agent_state.py
pyproject.toml
integuru/util/print.py
tests/test_integration_agent.py

Analysis:
integuru/main.py

from typing import List
from integuru.graph_builder import build_graph
from integuru.util.LLM import llm

agent = None

async def call_agent(
    model: str,
    prompt: str,
    har_file_path: str,
    cookie_path: str,
    input_variables: dict = None,
    max_steps: int = 15,
    to_generate_code: bool = False,
):  

    llm.set_default_model(model)

    global agent
    graph, agent = build_graph(prompt, har_file_path, cookie_path, to_generate_code)
    event_stream = graph.astream(
        {
            "master_node": None,
            "in_process_node": None,
            "to_be_processed_nodes": [],
            "in_process_node_dynamic_parts": [],
            "action_url": "",
            "input_variables": input_variables or {},  
        },
        {
            "recursion_limit": max_steps,
        },
    )
    async for event in event_stream:
        # print("+++", event)
        pass
integuru/init.py

integuru/graph_builder.py

from langgraph.graph import END, StateGraph
from integuru.models.agent_state import AgentState
from integuru.agent import IntegrationAgent
from functools import partial  # To pass extra arguments to functions
from integuru.util.print import print_dag, visualize_dag, print_dag_in_reverse

def check_end_condition(state, agent, to_generate_code):
    agent.dag_manager.detect_cycles()

    if len(state.get("to_be_processed_nodes", [])) == 0:
        print("------------------------Successfully analyzed!!!-------------------------------", flush=True)
        print_dag(agent.dag_manager.graph, agent.global_master_node_id)
        visualize_dag(agent.dag_manager.graph)
        print_dag_in_reverse(agent.dag_manager.graph, to_generate_code=to_generate_code)
        return "end"
    else:
        print("Continuing execution", flush=True)
        print(f"Generated graph at current step: {print_dag(agent.dag_manager.graph, agent.global_master_node_id)}", flush=True)
        return "continue"

def build_graph(prompt, har_file_path="network_requests.har", cookie_path="cookies.json", to_generate_code=False):
    agent = IntegrationAgent(prompt, har_file_path, cookie_path)

    graph_builder = StateGraph(AgentState)

    # Add nodes using the agent's methods
    graph_builder.add_node("IntegrationAgent", agent.end_url_identify_agent)
    graph_builder.set_entry_point("IntegrationAgent")

    graph_builder.add_node("urlTocurl", agent.url_to_curl)
    graph_builder.add_edge("IntegrationAgent", "urlTocurl")

    graph_builder.add_node(
        "dynamicurlDataIdentifyingAgent", agent.dynamic_part_identifying_agent
    )
    graph_builder.add_edge("urlTocurl", "dynamicurlDataIdentifyingAgent")

    graph_builder.add_node("inputVariablesIdentifyingAgent", agent.input_variables_identifying_agent)
    graph_builder.add_edge("dynamicurlDataIdentifyingAgent", "inputVariablesIdentifyingAgent")

    graph_builder.add_node("findcurlFromContent", agent.find_curl_from_content)
    graph_builder.add_edge("inputVariablesIdentifyingAgent", "findcurlFromContent")

    # Add conditional edges 
    graph_builder.add_conditional_edges(                
        "findcurlFromContent",
        partial(check_end_condition, agent=agent, to_generate_code=to_generate_code),
        {"end": END, "continue": "dynamicurlDataIdentifyingAgent"},
    )

    graph = graph_builder.compile()
    return graph, agent 
integuru/main.py

from dotenv import load_dotenv
import time  # Add this import

load_dotenv()

from integuru.main import call_agent
import asyncio
import click

@click.command()
@click.option(
    "--model", default="gpt-4o", help="The LLM model to use (default is gpt-4o)"
)
@click.option("--prompt", required=True, help="The prompt for the model")
@click.option(
    "--har-path",
    default="./network_requests.har",
    help="The HAR file path (default is ./network_requests.har)",
)
@click.option(
    "--cookie-path",
    default="./cookies.json",
    help="The cookie file path (default is ./cookies.json)",
)
@click.option(
    "--max_steps", default=20, type=int, help="The max_steps (default is 20)"
)
@click.option(
    "--input_variables",
    multiple=True,
    type=(str, str),
    help="Input variables in the format key value",
)
@click.option(
    "--generate-code",
    is_flag=True,
    default=False,
    help="Whether to generate the full integration code",
)
def cli(
    model, prompt, har_path, cookie_path, max_steps, input_variables, generate_code
):
    input_vars = dict(input_variables)
    asyncio.run(
        call_agent(
            model,
            prompt,
            har_path,
            cookie_path,
            input_variables=input_vars,
            max_steps=max_steps,
            to_generate_code=generate_code,
        )
    )

if __name__ == "__main__":
    cli()
integuru/agent.py

import json
import urllib
import os
from datetime import datetime
from typing import List, Dict, Any, Optional, Set

from integuru.util.LLM import llm
from integuru.models.DAGManager import DAGManager
from integuru.util.har_processing import *
from integuru.models.request import Request
from integuru.models.agent_state import AgentState

class IntegrationAgent:
    ACTION_URL_KEY: str = "action_url"
    IN_PROCESS_NODE_KEY: str = "in_process_node"
    TO_BE_PROCESSED_NODES_KEY: str = "to_be_processed_nodes"
    IN_PROCESS_NODE_DYNAMIC_PARTS_KEY: str = "in_process_node_dynamic_parts"
    MASTER_NODE_KEY: str = "master_node"
    INPUT_VARIABLES_KEY: str = "input_variables"

    def __init__(
        self,
        prompt: str,
        har_file_path: str,
        cookie_path: str,
    ):  
        self.prompt: str = prompt
        self.duplicate_part_set: Set[str] = set()
        self.global_master_node: Optional[str] = None
        self.req_to_res_map: Dict[Request, str] = parse_har_file(har_file_path)
        self.url_to_res_req_dict: Dict[str, Dict[str, Any]] = build_url_to_req_res_map(self.req_to_res_map)
        self.har_urls: List[Tuple[str, str, str, str]] = get_har_urls(har_file_path)
        self.cookie_dict: Dict[str, Dict[str, Any]] = parse_cookie_file_to_dict(cookie_path)
        self.curl_to_id_dict: Dict[str, str] = {}
        self.cookie_to_id_dict: Dict[str, str] = {}
        self.dag_manager: DAGManager = DAGManager()

    def end_url_identify_agent(self, state: AgentState) -> AgentState:
        """
        Identify the URL responsible for a specific action
        """
        function_def = {
            "name": "identify_end_url",
            "description": "Identify the URL responsible for a specific action",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": f"The URL responsible for {self.prompt}"
                    }
                },
                "required": ["url"]
            }
        }

        prompt = f"""
        {self.har_urls}
        Task:
        Given the above list of URLs, request types, and response formats, find the URL responsible for the action below:
        {self.prompt}
        """

        response = llm.get_instance().invoke(
            prompt,
            functions=[function_def],
            function_call={"name": "identify_end_url"}
        )

        function_call = response.additional_kwargs['function_call']
        end_url = json.loads(function_call['arguments'])['url']

        state[self.ACTION_URL_KEY] = end_url
        return state

    def input_variables_identifying_agent(self, state: AgentState) -> AgentState:
        """
        Identify input variables present in the cURL command
        """
        in_process_node_id = state[self.IN_PROCESS_NODE_KEY]
        curl = self.dag_manager.graph.nodes[in_process_node_id]["content"]["key"].to_curl_command()
        input_variables = state[self.INPUT_VARIABLES_KEY]
        if not input_variables:
            return state

        function_def = {
            "name": "identify_input_variables",
            "description": "Identify input variables present in the cURL command.",
            "parameters": {
                "type": "object",
                "properties": {
                    "identified_variables": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "variable_name": {"type": "string", "description": "The original key of the variable"},
                                "variable_value": {"type": "string", "description": "The exact version of the variable that is present in the cURL command. This should closely match the value in the provided Input Variables."}
                            },
                            "required": ["variable_name", "variable_value"]
                        },
                        "description": "A list of identified variables and their values."
                    }
                },
                "required": ["identified_variables"]
            }
        }

        prompt = f"""
        cURL: {curl}
        Input Variables: {input_variables}

        Task:
        Identify which input variables (the value in the key-value pair) from the Input Variables provided above are present in the cURL command.

        Important:
        - If an input variable is found in the cURL, include it in the output.
        - Do not include variables that are not provided above.
        - The key of the input variable is a description of the variable.
        - The value is the value that should closely match the value in the cURL command. No substitutions.

        """

        response = llm.get_instance().invoke(
            prompt,
            functions=[function_def],
            function_call={"name": "identify_input_variables"}
        )

        function_call = response.additional_kwargs.get('function_call', {})
        arguments = json.loads(function_call.get('arguments', '{}'))
        identified_variables = arguments.get('identified_variables', [])

        if identified_variables:
            # Convert the identified_variables format
            converted_variables = {item['variable_name']: item['variable_value'] for item in identified_variables}

            current_dynamic_parts = self.dag_manager.graph.nodes[in_process_node_id].get("dynamic_parts", [])
            updated_dynamic_parts = [part for part in current_dynamic_parts if part not in converted_variables.values()]
            self.dag_manager.update_node(in_process_node_id, dynamic_parts=updated_dynamic_parts, input_variables=converted_variables)

        return state

    def dynamic_part_identifying_agent(self, state: AgentState) -> AgentState:
        """
        Identify dynamic parts present in the cURL command
        """
        in_process_node_id = state[self.TO_BE_PROCESSED_NODES_KEY].pop()
        request = self.dag_manager.graph.nodes[in_process_node_id]["content"]["key"]
        curl = request.to_minified_curl_command()
        if curl.endswith(".js'"):
            self.dag_manager.update_node(in_process_node_id, dynamic_parts=[])
            state[self.IN_PROCESS_NODE_DYNAMIC_PARTS_KEY] = [] 
            state[self.IN_PROCESS_NODE_KEY] = in_process_node_id
            return state

        input_variables = state[self.INPUT_VARIABLES_KEY]            

        function_def = {
            "name": "identify_dynamic_parts",
            "description": (
                "Given the above cURL command, identify which parts are dynamic and validated by the server "
                "for correctness (e.g., IDs, tokens, session variables). Exclude any parameters that represent "
                "arbitrary user input or general data that can be hardcoded (e.g., amounts, notes, messages)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "dynamic_parts": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "List of dynamic parts identified in the cURL command. Do not include duplicates. "
                            "Only strictly include the dynamic values (not the keys or any not extra part in front and after the value) of parts that are unique to a user or session "
                            "and, if incorrect, will cause the request to fail."
                            "Do not include the keys, only the values."
                        ),
                    }
                },
                "required": ["dynamic_parts"],
            },
        }

        prompt = f"""
        URL: {curl}

        Task:

        Use your best judgment to identify which parts of the cURL command are dynamic, specific to a user or session, and are checked by the server for validity. These include tokens, IDs, session variables, or any other values that are unique to a user or session and, if incorrect, will cause the request to fail.

        Important:
            - IGNORE THE COOKIE HEADER
            - Ignore common headers like user-agent, sec-ch-ua, accept-encoding, referer, etc.
            - Exclude parameters that represent arbitrary user input or general data that can be hardcoded, such as amounts, notes, messages, actions, etc.
            - Only output the variable values and not the keys.
            - Only include dynamic parts that are unique identifiers, tokens, or session variables.

        """

        response = llm.get_instance().invoke(
            prompt,
            functions=[function_def],
            function_call={"name": "identify_dynamic_parts"}
        )

        function_call = response.additional_kwargs['function_call']
        dynamic_parts = json.loads(function_call['arguments'])['dynamic_parts']

        self.dag_manager.update_node(in_process_node_id, dynamic_parts=dynamic_parts)

        # to detect if input_variables are in the request
        present_variables = [variable for variable in input_variables if variable in curl]
        if present_variables:
            for variable in present_variables:
                if variable in dynamic_parts:
                    dynamic_parts.remove(variable)
            self.dag_manager.update_node(in_process_node_id, input_variables=present_variables)

        state[self.IN_PROCESS_NODE_DYNAMIC_PARTS_KEY] = dynamic_parts
        state[self.IN_PROCESS_NODE_KEY] = in_process_node_id
        return state

    def url_to_curl(self, state: AgentState) -> AgentState:
        """
        Identify the master cURL command responsible for the action
        """
        request = self.url_to_res_req_dict[state["action_url"]]["request"]
        curl = request.to_curl_command()
        if curl in self.curl_to_id_dict:
            master_node_id = self.curl_to_id_dict[curl]
        else:
            master_node_id = self.dag_manager.add_node(
                node_type="master_curl",  # Specify node type
                content={
                    "key": request,
                    "value": self.req_to_res_map[request]
                },
                dynamic_parts=["None"],
                extracted_parts=["None"]
            )
            self.curl_to_id_dict[curl] = master_node_id
        state[self.MASTER_NODE_KEY] = master_node_id
        state[self.TO_BE_PROCESSED_NODES_KEY].append(master_node_id)
        self.global_master_node_id = master_node_id
        return state

    def get_simplest_request(self, request_list: List[Request]) -> Request:
        """
        Find the index of the simplest cURL command from a list
        """
        function_def = {
            "name": "get_simplest_curl_index",
            "description": "Find the index of the simplest cURL command from a list",
            "parameters": {
                "type": "object",
                "properties": {
                    "index": {
                        "type": "integer",
                        "description": "The index of the simplest cURL command in the list"
                    }
                },
                "required": ["index"]
            }
        }
        # convert request objects to strings
        serializable_list = [str(req) for req in request_list]

        prompt = f"""
        {json.dumps(serializable_list)}
        Task:
        Given the above list of cURL commands, find the index of the curl that has the least number of dependencies and variables.
        The index should be 0-based (i.e., the first item has index 0).
        """

        response = llm.get_instance().invoke(
            prompt,
            functions=[function_def],
            function_call={"name": "get_simplest_curl_index"}
        )

        function_call = response.additional_kwargs['function_call']
        simplest_curl_index = json.loads(function_call['arguments'])['index']

        # Retrieve the actual cURL command using the index
        simplest_curl = request_list[simplest_curl_index]
        return simplest_curl

    def find_curl_from_content(self, state: AgentState) -> AgentState:
        """
        Find the cURL command that contains the dynamic parts
        """
        search_string_list = state[self.IN_PROCESS_NODE_DYNAMIC_PARTS_KEY]
        search_string_list_leftovers = search_string_list.copy()

        in_process_node_id = state[self.IN_PROCESS_NODE_KEY]
        new_to_be_processed_nodes = []

        # Handle cookies
        for search_string in search_string_list_leftovers[:]:
            cookie_key = self.find_key_by_string_in_value(
                self.cookie_dict, search_string
            )
            if cookie_key:
                search_string_list_leftovers.remove(search_string)
                if cookie_key in self.cookie_to_id_dict:
                    cookie_node_id = self.cookie_to_id_dict[cookie_key]
                else:
                    cookie_node_id = self.dag_manager.add_node(
                        node_type="cookie",  # Specify node type
                        content={
                            "key": cookie_key,
                            "value": search_string
                        }, 
                        extracted_parts=[search_string]
                    )
                    self.cookie_to_id_dict[cookie_key] = cookie_node_id
                    #dont need to add node to to_be_processed_nodes because cookies dont need further processing
                self.dag_manager.add_edge(in_process_node_id, cookie_node_id)

        # Handle curls
        if search_string_list_leftovers:
            for search_string in search_string_list_leftovers[:]:
                requests_with_search_string = []

                for request, response in self.req_to_res_map.items():
                    curl = str(request)
                    if (
                        (
                            isinstance(curl, str)
                            and search_string.lower() in response["text"].lower()
                        )
                        and (search_string.lower() not in curl.lower())
                    ) or (
                        urllib.parse.unquote(search_string) in curl
                        and (urllib.parse.unquote(search_string) not in curl)
                    ):
                        requests_with_search_string.append(request)
                simplest_request = ""

                # Get simplest curl to reduce number of dependencies
                if len(requests_with_search_string) > 1:
                    simplest_request = self.get_simplest_request(requests_with_search_string)
                elif len(requests_with_search_string) == 1:
                    simplest_request = requests_with_search_string[0]
                else:
                    print(f"Could not find curl with search string: {search_string} in response")
                    not_found_node_id = self.dag_manager.add_node(
                        node_type="not found",
                        content={
                            "key": search_string
                        },
                    )
                    self.dag_manager.add_edge(in_process_node_id, not_found_node_id)
                    search_string_list_leftovers.remove(search_string)

                    continue

                if simplest_request.url.endswith(".js") or "text/html" in self.req_to_res_map[simplest_request]["type"]:
                    current_dynamic_parts = self.dag_manager.graph.nodes[in_process_node_id].get("dynamic_parts", [])
                    updated_dynamic_parts = [part for part in current_dynamic_parts if part != search_string]
                    self.dag_manager.update_node(in_process_node_id, dynamic_parts=updated_dynamic_parts)
                    search_string_list_leftovers.remove(search_string)
                    continue    

                if simplest_request not in self.curl_to_id_dict:
                    if simplest_request.url.endswith(".js"):
                        self.dag_manager.update_node(in_process_node_id, dynamic_parts=[])
                        continue    

                    curl_node_id = self.dag_manager.add_node(
                        node_type="curl",  # Specify node type
                    content={
                        "key": simplest_request,
                        "value": self.req_to_res_map[simplest_request]
                    },
                    extracted_parts=[search_string]
                    )
                    self.curl_to_id_dict[simplest_request] = curl_node_id
                    new_to_be_processed_nodes.append(curl_node_id)
                else:
                    # append new extracted part to existing curl node
                    curl_node_id = self.curl_to_id_dict[simplest_request]
                    node = self.dag_manager.get_node(curl_node_id)
                    new_extracted_parts = node.get("extracted_parts", [])
                    new_extracted_parts.append(search_string)
                    # Remove duplicates from new_extracted_parts
                    new_extracted_parts = list(dict.fromkeys(new_extracted_parts))

                    self.dag_manager.update_node(curl_node_id, extracted_parts=new_extracted_parts)

                self.dag_manager.add_edge(in_process_node_id, curl_node_id)

        state[self.TO_BE_PROCESSED_NODES_KEY].extend(new_to_be_processed_nodes)
        state[self.IN_PROCESS_NODE_DYNAMIC_PARTS_KEY] = []
        return state

    @staticmethod
    def find_key_by_string_in_value(dictionary: Dict[str, Dict[str, Any]], search_string: str) -> Optional[str]:
        for key, value in dictionary.items():
            if search_string in value.get("value", ""):
                return key
        return None

.gitignore

# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class
.DS_Store

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
#  Usually these files are written by a python script from a template
#  before PyInstaller builds the exe, so as to inject date/other infos into it.
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
#   For a library or package, you might want to ignore these files since the code is
#   intended to run in multiple environments; otherwise, check them in:
# .python-version

# pipenv
#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.
#   However, in case of collaboration, if having platform-specific dependencies or dependencies
#   having no cross-platform support, pipenv may install dependencies that don't work, or not
#   install all needed dependencies.
#Pipfile.lock

# poetry
#   Similar to Pipfile.lock, it is generally recommended to include poetry.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
#   https://python-poetry.org/docs/basic-usage/#commit-your-poetrylock-file-to-version-control
#poetry.lock

# PEP 582; used by e.g. github.com/David-OConnor/pyflow
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# PyCharm
#  JetBrains specific template is maintainted in a separate JetBrains.gitignore that can
#  be found at https://github.com/github/gitignore/blob/main/Global/JetBrains.gitignore
#  and can be added to the global gitignore or merged into this file.  For a more nuclear
#  option (not recommended) you can uncomment the following to ignore the entire idea folder.
#.idea/

*.har
*.json
*.png
# Temporary files
temp*

generated_code.txt
generated_code.py

saved_files/
create_har.py

import asyncio
import json
from playwright.async_api import async_playwright

async def open_browser_and_wait():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)

        context = await browser.new_context(
            record_har_path="network_requests.har",  # Path to save the HAR file
            record_har_content="embed",  # Omit content to make the HAR file smaller
            # TODO record_har_url_filter="*",  # Optional URL filter
        )

        page = await context.new_page()

        print(
            "Browser is open. Press Enter in the terminal when you're ready to close the browser and save cookies..."
        )

        input("Press Enter to continue and close the browser...")

        # Ensure 2FA is completed before saving cookies
        cookies = await context.cookies()

        with open("cookies.json", "w") as f:
            json.dump(cookies, f, indent=4)

        await context.close()

        await browser.close()

asyncio.run(open_browser_and_wait())
README.md

Integuru

An AI agent that generates integration code by reverse-engineering platforms' internal APIs.

Integuru in Action

What Integuru Does

You use create_har.py to generate a file containing all browser network requests, a file with the cookies, and write a prompt describing the action triggered in the browser. The agent outputs runnable Python code that hits the platform's internal endpoints to perform the desired action.

How It Works

Let's assume we want to download utility bills:

The agent identifies the request that downloads the utility bills.
For example, the request URL might look like this:
https://www.example.com/utility-bills?accountId=123&userId=456
It identifies parts of the request that depend on other requests.
The above URL contains dynamic parts (accountId and userId) that need to be obtained from other requests.
accountId=123 userId=456
It finds the requests that provide these parts and makes the download request dependent on them. It also attaches these requests to the original request to build out a dependency graph.
GET https://www.example.com/get_account_id
GET https://www.example.com/get_user_id
This process repeats until the request being checked depends on no other request and only requires the authentication cookies.
The agent traverses up the graph, starting from nodes (requests) with no outgoing edges until it reaches the master node while converting each node to a runnable function.
Features

Generate a dependency graph of requests to make the final request that performs the desired action.
Allow input variables (for example, choosing the YEAR to download a document from). This is currently only supported for graph generation. Input variables for code generation coming soon!
Generate code to hit all requests in the graph to perform the desired action.
Setup

Set up your OpenAI API Keys and add the OPENAI_API_KEY environment variable. (We recommend using an account with access to models that are at least as capable as OpenAI o1-mini. Models on par with OpenAI o1-preview are ideal.)

Install Python requirements via poetry:

poetry install
Open a poetry shell:

poetry shell
Register the Poetry virtual environment with Jupyter:

poetry run ipython kernel install --user --name=integuru
Run the following command to spawn a browser:

poetry run python create_har.py
Log into your platform and perform the desired action (such as downloading a utility bill).

Run Integuru:

poetry run integuru --prompt "download utility bills" --model <gpt-4o|o1-preview|o1-mini|o1>
You can also run it via Jupyter Notebook main.ipynb

Recommended to use gpt-4o as the model for graph generation as it supports function calling. Integuru will automatically switch to o1-preview for code generation if available in the user's OpenAI account.

Usage

After setting up the project, you can use Integuru to analyze and reverse-engineer API requests for external platforms. Simply provide the appropriate .har file and a prompt describing the action that you want to trigger.

poetry run integuru --help
Usage: integuru [OPTIONS]

Options:
  --model TEXT                    The LLM model to use (default is gpt-4o)
  --prompt TEXT                   The prompt for the model  [required]
  --har-path TEXT                 The HAR file path (default is
                                  ./network_requests.har)
  --cookie-path TEXT              The cookie file path (default is
                                  ./cookies.json)
  --max_steps INTEGER             The max_steps (default is 20)
  --input_variables <TEXT TEXT>...
                                  Input variables in the format key value
  --generate-code                 Whether to generate the full integration
                                  code
  --help                          Show this message and exit.
Running Unit Tests

To run unit tests using pytest, use the following command:

poetry run pytest
Continuous Integration (CI) Workflow

This repository includes a CI workflow using GitHub Actions. The workflow is defined in the .github/workflows/ci.yml file and is triggered on each push and pull request to the main branch. The workflow performs the following steps:

Checks out the code.
Sets up Python 3.12.
Installs dependencies using poetry.
Runs tests using pytest.
Note on 2FA

When the destination site uses two-factor authentication (2FA), the workflow remains the same. Ensure that you complete the 2FA process and obtain the cookies/auth tokens/session tokens after 2FA. These tokens will be used in the workflow.

Demo

Contributing

Contributions to improve Integuru are welcome. Please feel free to submit issues or pull requests on the project's repository.

Info

Integuru is built by Integuru.ai. Besides our work on the agent, we take custom requests for new integrations or additional features for existing supported platforms. We also offer hosting and authentication services. If you have requests or want to work with us, reach out at richard@taiki.online.

We open-source unofficial APIs that we've built already. You can find them here.

Privacy Policy

Data Storage

Collected data is stored locally in the network_requests.har and cookies.json files.

LLM Usage

The tool uses a cloud-based LLM (OpenAI's GPT-4o and o1-preview models).

LLM Training

The LLM is not trained or improved by the usage of this tool.

.github/workflows/ci.yml

name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.12

      - name: Install dependencies
        run: |
          curl -sSL https://install.python-poetry.org | python3 -
          poetry install

      - name: Run tests
        run: poetry run pytest
integuru/models/DAGManager.py

from typing import List, Optional, Literal, Dict # Import Literal for type enforcement
import networkx as nx
import uuid

class DAGManager:
    NODE_TYPES = {"cookie", "master", "cURL"}  

    def __init__(self):
        self.graph = nx.DiGraph()
        self.root_id = None 
    def add_node(
        self,
        node_type: Literal["cookie", "master", "cURL", "not found"],  
        content: Optional[dict] = None,  
        dynamic_parts: Optional[List[str]] = None,
        extracted_parts: Optional[List[str]] = None,
        input_variables: Optional[Dict[str, str]] = None,
    ):
        node_id = str(uuid.uuid4())
        self.graph.add_node(node_id, node_type=node_type, content=content, dynamic_parts=dynamic_parts, extracted_parts=extracted_parts, input_variables=input_variables)
        return node_id

    def update_node(
        self, 
        node_id: str, 
        **attributes: Optional[List[str]]):

        for attr, value in attributes.items():
            if value is not None:
                self.graph.nodes[node_id][attr] = value

    def detect_cycles(self):
        """
        Detects if there are cycles in the DAG managed by this class.
        If a cycle is found, it returns the list of nodes involved in the cycle.
        If no cycle is found, it returns None.

        Returns:
        - A list of nodes forming a cycle, or None if no cycles are found.
        """
        try:
            cycle = list(nx.find_cycle(self.graph, orientation='original'))
            print("Cycle detected:")
            return cycle
        except nx.exception.NetworkXNoCycle:
            return None

    def get_node(self, node_id: str) -> Optional[Dict]:
        """
        Retrieves the attributes of the specified node.

        :param node_id: ID of the node to retrieve.
        :return: Dictionary of node attributes or None if the node does not exist.
        """
        return self.graph.nodes.get(node_id, None)

    def add_edge(self, from_node_id: str, to_node_id: str):
        self.graph.add_edge(from_node_id, to_node_id)

    def __str__(self):
        nodes_info = []
        for node_id in self.graph.nodes:
            attrs = self.graph.nodes[node_id]
            nodes_info.append(f"{node_id}: {attrs}")
        return "\n".join(nodes_info)
integuru/models/request.py

from typing import List, Dict, Optional, Any
import json

class Request:
    def __init__(self, method: str, url: str, headers: Dict[str, str], 
                 query_params: Optional[Dict[str, str]] = None, body: Optional[Any] = None):
        self.method = method
        self.url = url
        self.headers = headers  
        self.query_params = query_params
        self.body = body

    def to_curl_command(self) -> str:
        curl_parts = [f"curl -X {self.method}"]

        for name, value in self.headers.items():
            curl_parts.append(f"-H '{name}: {value}'")

        if self.query_params:
            query_string = "&".join([f"{k}={v}" for k, v in self.query_params.items()])
            self.url += f"?{query_string}"

        if self.body:
            content_type = None
            for k in self.headers:
                if k.lower() == 'content-type':
                    content_type = self.headers[k]
                    break

            if isinstance(self.body, dict):
                # Add Content-Type header if not present
                if not content_type:
                    curl_parts.append(f"-H 'Content-Type: application/json'")
                curl_parts.append(f"--data '{json.dumps(self.body)}'")
            elif isinstance(self.body, str):
                curl_parts.append(f"--data '{self.body}'")

        curl_parts.append(f"'{self.url}'")

        return " ".join(curl_parts)

    def to_minified_curl_command(self) -> str:
        """
        Minifies the curl command by removing referer and cookie headers.
        This is done to reduce LLM hallucinations.
        """
        curl_parts = [f"curl -X {self.method}"]

        for name, value in self.headers.items():
            if name.lower() not in ['referer', 'cookie']:
                curl_parts.append(f"-H '{name}: {value}'")

        if self.query_params:
            query_string = "&".join([f"{k}={v}" for k, v in self.query_params.items()])
            self.url += f"?{query_string}"

        if self.body:
            content_type = None
            for k in self.headers:
                if k.lower() == 'content-type':
                    content_type = self.headers[k]
                    break

            if isinstance(self.body, dict):
                if not content_type:
                    curl_parts.append(f"-H 'Content-Type: application/json'")
                curl_parts.append(f"--data '{json.dumps(self.body)}'")
            elif isinstance(self.body, str):
                curl_parts.append(f"--data '{self.body}'")

        curl_parts.append(f"'{self.url}'")

        return " ".join(curl_parts)

    def __str__(self) -> str:
        return self.to_curl_command()
integuru/util/LLM.py

from langchain_openai import ChatOpenAI

class LLMSingleton:
    _instance = None
    _default_model = "gpt-4o"  
    _alternate_model = "o1-preview"

    @classmethod
    def get_instance(cls, model: str = None):
        if model is None:
            model = cls._default_model

        if cls._instance is None:
            cls._instance = ChatOpenAI(model=model, temperature=1)
        return cls._instance

    @classmethod
    def set_default_model(cls, model: str):
        """Set the default model to use when no specific model is requested"""
        cls._default_model = model
        cls._instance = None  # Reset instance to force recreation with new model

    @classmethod
    def revert_to_default_model(cls):
        """Set the default model to use when no specific model is requested"""
        print("Reverting to default model: ", cls._default_model, "Performance will be degraded as Integuru is using non O1 model")
        cls._alternate_model = cls._default_model

    @classmethod
    def switch_to_alternate_model(cls):
        """Returns a ChatOpenAI instance configured for o1-miniss"""
        # Create a new instance only if we don't have one yet
        cls._instance = ChatOpenAI(model=cls._alternate_model, temperature=1)

        return cls._instance

llm = LLMSingleton()

integuru/util/har_processing.py

import json
import os
from urllib.parse import urlparse
from integuru.models.request import Request
from typing import Tuple, Dict, Optional, Any, List

excluded_keywords = (
    "google",
    "taboola",
    "datadog",
    "sentry",
    # "relic"
)

excluded_header_keywords = (
    "cookie",
    "sec-",
    "accept",
    "user-agent",
    "referer",
    "relic",
    "sentry",
    "datadog",
    "amplitude",
    "mixpanel",
    "segment",
    "heap",
    "hotjar",
    "fullstory",
    "pendo",
    "optimizely",
    "adobe",
    "analytics",
    "tracking",
    "telemetry",
    "clarity",  # Microsoft Clarity
    "matomo",
    "plausible",
)

def format_request(har_request: Dict[str, Any]) -> Request:
    """
    Formats a HAR request into a Request object.
    """
    method = har_request.get("method", "GET")
    url = har_request.get("url", "")

    # Store headers as a dictionary, excluding headers containing excluded keywords
    headers = {
        header.get("name", ""): header.get("value", "")
        for header in har_request.get("headers", [])
        if not any(keyword.lower() in header.get("name", "").lower() 
                  for keyword in excluded_header_keywords)
    }

    query_params_list = har_request.get("queryString", [])
    query_params = {param["name"]: param["value"] for param in query_params_list} if query_params_list else None

    post_data = har_request.get("postData", {})
    body = post_data.get("text") if post_data else None

    # Try to parse body as JSON if Content-Type is application/json
    if body:
        headers_lower = {k.lower(): v for k, v in headers.items()}
        content_type = headers_lower.get('content-type')
        if content_type and 'application/json' in content_type.lower():
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                pass  # Keep body as is if not valid JSON

    return Request(
        method=method,
        url=url,
        headers=headers, 
        query_params=query_params,
        body=body
    )

def format_response(har_response: Dict[str, Any]) -> Dict[str, str]:
    """
    Extracts and returns the content text and content type from a HAR response.
    """
    content = har_response.get("content", {})
    return {
        "text": content.get("text", ""),
        "type": content.get("mimeType", "")
    }

def parse_har_file(har_file_path: str) -> Dict[Request, Dict[str, str]]:
    """
    Parses the HAR file and returns a dictionary mapping Request objects to response dictionaries.
    """
    req_res_dict = {}

    with open(har_file_path, 'r', encoding='utf-8') as file:
        har_data = json.load(file)

    entries = har_data.get("log", {}).get("entries", [])

    for entry in entries:
        request_data = entry.get("request", {})
        response_data = entry.get("response", {})

        formatted_request = format_request(request_data)
        response_dict = format_response(response_data)

        req_res_dict[formatted_request] = response_dict

    return req_res_dict

def build_url_to_req_res_map(req_res_dict: Dict[Request, Dict[str, str]]) -> Dict[str, Dict[str, Any]]:
    """
    Builds a dictionary mapping URLs to {'request': formatted_request, 'response': response_dict}
    """
    url_to_req_res_dict = {}

    for request, response in req_res_dict.items():
        url = request.url
        # If multiple requests to the same URL, you can choose to overwrite or store all
        url_to_req_res_dict[url] = {
            'request': request,
            'response': response
        }

    return url_to_req_res_dict

def get_har_urls(har_file_path: str) -> List[Tuple[str, str, str, str]]:
    """
    Extracts and returns a list of tuples containing method, URL, response format, and response preview
    from a HAR file, excluding certain file types and keywords.
    """
    # List to store tuples of URLs, request methods, response file formats, and response preview
    urls_with_details = []

    # Define a tuple of file extensions to exclude
    excluded_extensions = (
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".webp",
        ".svg",
        ".ico",  # Image files
        ".css",  # Stylesheets
        # ".js",
        # ".map",  # JavaScript files
        ".woff",
        ".woff2",
        ".ttf",
        ".otf",
        ".eot",  # Font files
        ".mp3",
        ".mp4",
        ".wav",
        ".avi",
        ".mov",
        ".flv",
        ".wmv",
        ".webm",  # Media files
        # ".pdf",
        # ".zip",
        ".rar",
        ".7z",
        ".tar",
        ".gz",
        ".exe",
        ".dmg",  # Other non-text files
    )

    # Read the HAR file
    with open(har_file_path, "r", encoding="utf-8") as file:
        har_data = json.load(file)

    # Extract entries from the HAR data
    entries = har_data.get("log", {}).get("entries", [])   
    for entry in entries:
        request = entry.get("request", {})
        response = entry.get("response", {})
        url = request.get("url")
        method = request.get("method", "GET")  # Default to 'GET' if method is missing
        response_format = response.get("content", {}).get("mimeType", "")
        response_text = response.get("content", {}).get("text", "")
        response_preview = response_text[:30] if response_text else ""

        if url:
            parsed_url = urlparse(url)
            path = parsed_url.path.lower()

            _, extension = os.path.splitext(path)

            request_text = url.lower()

            headers = request.get("headers", [])
            for header in headers:
                request_text += header.get("name", "").lower()
                request_text += header.get("value", "").lower()

            postData = request.get("postData", {}).get("text", "").lower()
            request_text += postData

            # Exclude URLs with the specified extensions or if keywords are in the request
            # this is done to reduce the number of requests we send to the LLM
            if extension not in excluded_extensions and not any(
                keyword.lower() in request_text for keyword in excluded_keywords
            ):
                urls_with_details.append((method, url, response_format, response_preview))

    return urls_with_details

def parse_cookie_file_to_dict(cookie_file_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Parses a JSON cookie file and returns a dictionary of cookie data.
    """
    parsed_data = {}

    with open(cookie_file_path, "r") as file:
        cookies = json.load(file)  

    for cookie in cookies:
        name = cookie.get("name")
        value = cookie.get("value")
        domain = cookie.get("domain")
        path = cookie.get("path")

        if name:
            parsed_data[name] = {
                "value": value,
                "domain": domain,
                "path": path,
                "expires": cookie.get("expires"),
                "httpOnly": cookie.get("httpOnly"),
                "secure": cookie.get("secure"),
                "sameSite": cookie.get("sameSite"),
            }

    return parsed_data
integuru/models/agent_state.py

from typing import List, Optional, TypedDict, Dict

class AgentState(TypedDict):
    master_node: str 
    in_process_node: str
    to_be_processed_nodes: List[str]
    in_process_node_dynamic_parts: List[str]
    action_url: str
    input_variables: Dict[str, str]
pyproject.toml

[tool.poetry]
name = "integuru"
version = "0.1.0"
description = ""
authors = ["alanalanlu <alanlu1999@gmail.com>"]
readme = "README.md"

[tool.poetry.dependencies]
python = "^3.12"
langchain-openai = "^0.2.0"
langchain-core = "^0.3.1"
langgraph = "^0.2.22"
langsmith = "^0.1.122"
python-dotenv = "^1.0.1"
click = "^8.1.7"
playwright = "^1.47.0"
networkx = "^3.3"
matplotlib = "^3.9.2"
ipykernel = "^6.29.5"

[tool.poetry.scripts]
integuru = "integuru.__main__:cli"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
integuru/util/print.py

from platform import node
import matplotlib.pyplot as plt
import networkx as nx
from typing import Dict, Set, Optional, Any
from integuru.util.LLM import llm
import json
from langchain_openai import ChatOpenAI
from typing import List
from openai import NotFoundError  # Add this import

def print_dag(
    graph: nx.DiGraph,
    current_node_id: str,
    prefix: str = "",
    is_last: bool = True,
    visited: Optional[Set[str]] = None,
    depth: int = 0,
    max_depth: Optional[int] = None,
) -> None:
    """
    Recursively prints the DAG structure with visual connectors and cUrl.
    """
    if visited is None:
        visited = set()

    connector = "└── " if is_last else "├── "
    new_prefix = prefix + ("    " if is_last else "│   ")

    node_attrs = graph.nodes[current_node_id]
    dynamic_parts = node_attrs.get("dynamic_parts", [])
    key = node_attrs.get("content", "").get("key", "")
    extracted_parts = node_attrs.get("extracted_parts", [])
    input_variables = node_attrs.get("input_variables", [])
    node_type = node_attrs.get("node_type", "")  # Get node type

    node_label = f"[{node_type}] [node_id: {current_node_id}]"
    if input_variables:
        node_label += f"\n{new_prefix}    [input_variables: {input_variables}]"
    node_label += f"\n{new_prefix}    [dynamic_parts: {dynamic_parts}]"
    node_label += f"\n{new_prefix}    [extracted_parts: {extracted_parts}]"
    node_label += f"\n{new_prefix}    [{key}]"

    print(f"{prefix}{connector}{node_label}")

    visited.add(current_node_id)

    if max_depth is not None and depth >= max_depth:
        return

    children = list(graph.successors(current_node_id))
    child_count = len(children)

    for i, child_id in enumerate(children):
        is_last_child = i == child_count - 1

        if child_id in visited:
            loop_connector = "└── " if is_last_child else "├── "
            print(f"{new_prefix}{loop_connector}(Already visited) [node_id: {child_id}]")
        else:
            print_dag(
                graph,
                child_id,
                prefix=new_prefix,
                is_last=is_last_child,
                visited=visited,
                depth=depth + 1,
                max_depth=max_depth,
            )

def visualize_dag(graph: nx.DiGraph) -> None:
    """
    Visualizes the DAG using Matplotlib with arrows indicating direction.
    """
    plt.switch_backend("Agg")

    pos = nx.spring_layout(graph) 

    nx.draw_networkx_nodes(graph, pos, node_size=700, node_color="lightblue")

    nx.draw_networkx_edges(
        graph, pos, edgelist=graph.edges, arrowstyle="->", arrowsize=20
    )

    labels = {node: f"{node}" for node in graph.nodes()}
    nx.draw_networkx_labels(graph, pos, labels, font_size=10)

    edge_labels = nx.get_edge_attributes(graph, "cUrl") 
    nx.draw_networkx_edge_labels(graph, pos, edge_labels=edge_labels)

    plt.title("Directed Acyclic Graph (DAG)")
    plt.savefig("dag_visualization.png")
    plt.close()

def find_json_path(json_obj, target_value, current_path=None):
    """
    Finds the path(s) to a given value in a JSON object.

    Args:
    json_obj (dict or list): The JSON object to search.
    target_value: The value to find in the JSON object.
    current_path (list): The current path being explored (used for recursion).

    Returns:
    list: A list of dictionaries, each containing 'key_path' and 'value' for each occurrence of the target value.
    """
    if current_path is None:
        current_path = []

    results = []

    if isinstance(json_obj, dict):
        for key, value in json_obj.items():
            new_path = current_path + [key]
            if value == target_value:
                results.append({
                    'key_path': new_path,
                    'value': value
                })
            if isinstance(value, (dict, list)):
                results.extend(find_json_path(value, target_value, new_path))
    elif isinstance(json_obj, list):
        for i, item in enumerate(json_obj):
            new_path = current_path + [i]
            if item == target_value:
                results.append({
                    'key_path': new_path,
                    'value': item
                })
            if isinstance(item, (dict, list)):
                results.extend(find_json_path(item, target_value, new_path))

    return results

def generate_code(node_id: str, graph: nx.DiGraph) -> str:
    """
    Generates Python code for a given node in the graph based on its attributes.
    """

    node_attrs = graph.nodes[node_id]

    if node_attrs.get("node_type", "") == "cookie":
        cookie_value = node_attrs.get('content', {}).get('value', '')
        cookie_key = node_attrs.get('content', {}).get('key', '')
        return f"{cookie_value} = cookie_dict['{cookie_key}']"

    content = node_attrs.get("content", {})
    curl = content.get("key", "")
    response = content.get("value", {})
    response_type = response.get("type", "")
    response_text = response.get("text", "")

    dynamic_parts = node_attrs.get("dynamic_parts", "")
    extracted_parts = node_attrs.get("extracted_parts", "")
    input_variables = node_attrs.get("input_variables", "")
    to_parse_response = True

    parse_response_prompt = ""

    if response_type in ["application/octet-stream", "application/pdf", "application/zip", "image/jpeg", "image/png"]:
        parse_response_prompt = f"""
            The response is a downloadable file of type {response_type}.
            Include code to save the response content to a file with an appropriate extension.
        """

    if "application/json" in response_type:
        key_paths = []
        for extracted_part in extracted_parts:
            key_path = find_json_path(json.loads(response_text), extracted_part)
            key_paths.append(key_path)

        parse_response_prompt = f"""
            Response:
            {response_text}

            Parse out the following variables from the response using JSON keys:
            {key_paths}

            Through your judgement from analyzing the response, if polling is required to retrieve the variables above from the response. If so, implement polling else dont.
        """

    if "text/html" in response_type or "application/javascript" in response_type:
        if len(response_text) > 100000:
            context_snippets = []
            for part in extracted_parts:
                index = response_text.find(part)
                if index != -1:
                    start = max(0, index - 50)
                    end = min(len(response_text), index + len(part) + 50)
                    snippet = response_text[start:end]
                    context_snippets.append(f"{part}: {snippet}")

            parse_response_prompt = f"""
                The HTML response is too long to process entirely. 
                Here are the relevant sections for each variable to be extracted:

                {chr(10).join(context_snippets)}

            """
        else:
            parse_response_prompt = f"""
                Response:
                {response_text}
            """
        parse_response_prompt += f"""
            Parse out the variables following variables locations from the response using regex using locational context: 

            {extracted_parts}
            Do not include the variable in the regex filter as the variable will change. And do not be too specific with the regex.

        """

    dynamic_parts_prompt = ""
    if dynamic_parts:
        dynamic_parts_prompt = f"""
    Instead of hard coding, pass the following variables into the function as parameters in a dict. The dict should have keys thats the same as the value itself
    {dynamic_parts} 

    Keep everything else in the header hardcoded.
    """

    prompt = f"""
    Task:
    Write a Python function with a descriptive name that makes a request like the cURL below:
    {curl}

    Assume cookies are in a variable as parameter called "cookie_string".

    The parameters should be {"1. a dict of all the parameters and 2. Just the cookie string" if dynamic_parts else "only the cookie string"}.

    {dynamic_parts_prompt}

    {parse_response_prompt}

    Return a dictionary with the keys as the original parsed values content (needs to be hardcoded) and the values as the parsed values.

    Do not include pseudo-headers or any headers that start with a colon in the request.

    IMPORTANT! Do not include any backticks or markdown syntax AT ALL

    """

    # Make the API call using o1_llm

    llm_model = llm.switch_to_alternate_model()
    try:
        response = llm_model.invoke(prompt)
    except Exception as e:
        print("Switching to default model")
        llm.revert_to_default_model()
        response = llm.switch_to_alternate_model().invoke(prompt)

    # Extract the generated code from the response
    code = response.content.strip()

    # cannot get chatgpt to not return backticks
    if code.startswith("```python"):
        code = code[10:]
    if code.endswith("```"):
        code = code[:-3]

    return code

def aggregate_functions(txt_path, output_path):
    # Read the content of the file
    with open(txt_path, 'r') as file:
        content = file.read()

    # Initialize ChatGPT

    # Prepare the prompt for ChatGPT
    prompt = f"""
    The following text contains multiple Python functions:

    {content}

    Please generate Python code that does the following:    
    1. Fix up the functions if needed in the order they appear in the text.
    2. Leave everything that is hardcoded as is.
    3. Call each function in the order they appear in the text.
    4. The cookies will be hard coded in the file in a string format of key=value;key=value. You will need to convert them to a dict to retrieve values from them.
    5. Pass the return value of each function as an argument to the next function, if applicable.
    6. Ensure that the last function in the text is called last.
    7. Output the entire directly runnable code

    Only provide the Python code, without any explanations or markdown formatting.
    DO NOT include any backticks or markdown syntax AT ALL
    """

    # Get the response from ChatGPT

    llm_model = llm.switch_to_alternate_model()
    try:
        response = llm_model.invoke(prompt)
    except Exception as e:
        print("Switching to default model")
        llm.revert_to_default_model()
        response = llm.switch_to_alternate_model().invoke(prompt)
    # Extract the generated code
    generated_code = response.content.strip()

    # Save the generated code to the specified output file
    with open(output_path, 'w') as file:
        file.write(generated_code)

    print(f"Aggregated function calls have been saved to '{output_path}'")

    return output_path

def generate_obfuscation_map(dynamic_parts_list: List[str]) -> Dict[str, str]:
    obfuscation_map = {}
    for part in dynamic_parts_list:
        # Replace invalid characters with underscores and prepend with 'var_' to ensure it starts with a letter
        safe_key = f"var_{hash(part)}".replace('-', '_').replace('.', '_')
        obfuscation_map[part] = safe_key
    return obfuscation_map

def swap_string_using_obfuscation_map(input_string: str, obfuscation_map: Dict[str, str]) -> str:
    """
    Swaps all parts in the input string that match keys in the obfuscation map with their corresponding values.

    Args:
    input_string (str): The string to perform replacements on.
    obfuscation_map (Dict[str, str]): The obfuscation map with keys to be replaced by their values.

    Returns:
    str: The modified string with replacements made.
    """
    for key, value in obfuscation_map.items():
        input_string = input_string.replace(key, value)
    return input_string

def print_dag_in_reverse(graph: nx.DiGraph, max_depth: Optional[int] = None, to_generate_code: bool = False) -> None:
    """
    Generates the order of requests to be made based on the DAG.
    Prints the DAG starting from source nodes and ending at sink nodes, traversing successors.
    """
    if to_generate_code:
        print("--------------Generating code------------")

    generated_code = ""

    dynamic_parts_list = []

    def _print_dag_recursive(
        current_node_id: str,
        prefix: str = "",
        is_last: bool = True,
        visited: Optional[Set[str]] = None,
        fully_processed: Optional[Set[str]] = None,
        depth: int = 0,
    ) -> None:
        """
        Helper function to recursively print the DAG in reverse order.
        """
        nonlocal generated_code, dynamic_parts_list
        if visited is None:
            visited = set()
        if fully_processed is None:
            fully_processed = set()

        if current_node_id in fully_processed:
            return

        if current_node_id in visited:
            # Avoid infinite recursion in case of cycles
            return

        visited.add(current_node_id)

        if max_depth is not None and depth >= max_depth:
            visited.remove(current_node_id)
            return

        # Get child nodes (successors)
        children = list(graph.successors(current_node_id))
        child_count = len(children)

        # Recursively process child nodes first
        for i, child_id in enumerate(children):
            is_last_child = i == child_count - 1
            new_prefix = prefix + ("    " if is_last else "│   ")
            _print_dag_recursive(
                child_id,
                prefix=new_prefix,
                is_last=is_last_child,  # Ensure this argument is passed correctly
                visited=visited,
                fully_processed=fully_processed,
                depth=depth + 1,
            )

        # After all children have been processed, print the current node
        connector = "└── " if is_last else "├── "
        print(f"{prefix}{connector}{get_node_label(graph, current_node_id)}")
        if to_generate_code:
            generated_code += generate_code(current_node_id, graph) + "\n\n"
        fully_processed.add(current_node_id)
        visited.remove(current_node_id)

    def get_node_label(graph: nx.DiGraph, node_id: str) -> str:
        """
        Generates a label for a node in the graph based on its attributes.
        """
        # Get node attributes
        node_attrs = graph.nodes[node_id]
        dynamic_parts = node_attrs.get("dynamic_parts", [])
        extracted_parts = node_attrs.get("extracted_parts", "")
        content = node_attrs.get("content", "")
        key = content.get("key", "")
        input_variables = node_attrs.get("input_variables", "")

        if dynamic_parts:
            dynamic_parts_list.extend(dynamic_parts)
        node_type = node_attrs.get("node_type", "")
        node_label = f"[{node_type}] "
        node_label += f"[node_id: {node_id}]"
        node_label += f" [dynamic_parts: {dynamic_parts}]"
        node_label += f" [extracted_parts: {extracted_parts}]"
        node_label += f" [input_variables: {input_variables}]"
        node_label += f" [{key}]"
        return node_label

    # Start from source nodes (nodes with no incoming edges)
    source_nodes = [n for n in graph.nodes() if graph.in_degree(n) == 0]

    fully_processed = set()
    for idx, source_node in enumerate(source_nodes):
        is_last_source = idx == len(source_nodes) - 1
        _print_dag_recursive(
            source_node,
            prefix="",
            is_last=is_last_source,
            visited=set(),
            fully_processed=fully_processed,
            depth=0,
        )

    if to_generate_code:
        obfuscation_map = generate_obfuscation_map(dynamic_parts_list)
        generated_code = swap_string_using_obfuscation_map(generated_code, obfuscation_map)
        with open("generated_code.txt", "w") as f:
            f.write(generated_code)

        aggregate_functions("generated_code.txt", "generated_code.py")
        print("--------------Generated integration code in generated_code.py!!------------")

tests/test_integration_agent.py

import unittest
from integuru.agent import IntegrationAgent
from integuru.models.agent_state import AgentState
from unittest.mock import patch, MagicMock

class TestIntegrationAgent(unittest.TestCase):

    def setUp(self):
        self.prompt = "Test prompt"
        self.har_file_path = "test.har"
        self.cookie_path = "test_cookies.json"
        self.agent = IntegrationAgent(self.prompt, self.har_file_path, self.cookie_path)
        self.state = AgentState(
            master_node=None,
            in_process_node=None,
            to_be_processed_nodes=[],
            in_process_node_dynamic_parts=[],
            action_url="",
            input_variables={}
        )

    @patch('integuru.agent.llm.get_instance')
    def test_end_url_identify_agent(self, mock_llm_instance):
        mock_response = MagicMock()
        mock_response.additional_kwargs = {
            'function_call': {
                'arguments': '{"url": "http://example.com/action"}'
            }
        }
        mock_llm_instance.return_value.invoke.return_value = mock_response

        updated_state = self.agent.end_url_identify_agent(self.state)
        self.assertEqual(updated_state[self.agent.ACTION_URL_KEY], "http://example.com/action")

    @patch('integuru.agent.llm.get_instance')
    def test_input_variables_identifying_agent(self, mock_llm_instance):
        self.state[self.agent.IN_PROCESS_NODE_KEY] = "node_1"
        self.state[self.agent.INPUT_VARIABLES_KEY] = {"var1": "value1"}
        self.agent.dag_manager.graph.add_node("node_1", content={"key": MagicMock()})
        self.agent.dag_manager.graph.nodes["node_1"]["content"]["key"].to_curl_command.return_value = "curl command"

        mock_response = MagicMock()
        mock_response.additional_kwargs = {
            'function_call': {
                'arguments': '{"identified_variables": [{"variable_name": "var1", "variable_value": "value1"}]}'
            }
        }
        mock_llm_instance.return_value.invoke.return_value = mock_response

        updated_state = self.agent.input_variables_identifying_agent(self.state)
        self.assertEqual(updated_state[self.agent.INPUT_VARIABLES_KEY], {"var1": "value1"})

    @patch('integuru.agent.llm.get_instance')
    def test_dynamic_part_identifying_agent(self, mock_llm_instance):
        self.state[self.agent.TO_BE_PROCESSED_NODES_KEY] = ["node_1"]
        self.agent.dag_manager.graph.add_node("node_1", content={"key": MagicMock()})
        self.agent.dag_manager.graph.nodes["node_1"]["content"]["key"].to_minified_curl_command.return_value = "curl command"

        mock_response = MagicMock()
        mock_response.additional_kwargs = {
            'function_call': {
                'arguments': '{"dynamic_parts": ["dynamic_part1"]}'
            }
        }
        mock_llm_instance.return_value.invoke.return_value = mock_response

        updated_state = self.agent.dynamic_part_identifying_agent(self.state)
        self.assertEqual(updated_state[self.agent.IN_PROCESS_NODE_DYNAMIC_PARTS_KEY], ["dynamic_part1"])

if __name__ == '__main__':
    unittest.main()