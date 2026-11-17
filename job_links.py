"""Import public job-page text without browser execution or private-network access."""
import http.client
import ipaddress
import json
import re
import socket
import ssl
import time
from html.parser import HTMLParser
from urllib.parse import urlsplit, urljoin

MAX_PAGE_BYTES = 2 * 1024 * 1024
FAILURE = 'Could not read this public job page. It may require login or block imports. Paste the job description instead.'


class PageText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.scripts = []
        self.script = None
        self.ignored = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript', 'svg'):
            self.ignored.append(tag)
            if tag == 'script' and dict(attrs).get('type', '').lower() == 'application/ld+json':
                self.script = []
        elif tag in ('p', 'div', 'li', 'br', 'h1', 'h2', 'h3', 'section', 'article') and not self.ignored:
            self.parts.append('\n')

    def handle_endtag(self, tag):
        if self.ignored and tag == self.ignored[-1]:
            if tag == 'script' and self.script is not None:
                self.scripts.append(''.join(self.script))
                self.script = None
            self.ignored.pop()
        elif tag in ('p', 'div', 'li', 'h1', 'h2', 'h3', 'section', 'article') and not self.ignored:
            self.parts.append('\n')

    def handle_data(self, data):
        if self.script is not None:
            self.script.append(data)
        elif not self.ignored:
            self.parts.append(data)

    def text(self):
        return '\n'.join(line for line in (re.sub(r'[ \t\r\f\v]+', ' ', s).strip() for s in ''.join(self.parts).split('\n')) if line)


def job_posting(value):
    if isinstance(value, list):
        for item in value:
            found = job_posting(item)
            if found:
                return found
    elif isinstance(value, dict):
        types = value.get('@type', [])
        if isinstance(types, str):
            types = [types]
        if isinstance(types, list) and 'JobPosting' in types and isinstance(value.get('description'), str):
            return value
        if '@graph' in value:
            return job_posting(value['@graph'])
    return None


def extract_job_text(content, html=True):
    if html:
        page = PageText()
        page.feed(content)
        text = page.text()
        for script in page.scripts:
            try:
                posting = job_posting(json.loads(script))
            except (ValueError, RecursionError):
                continue
            if posting:
                description = PageText()
                description.feed(posting['description'])
                title = posting.get('title', '')
                text = ((title + '\n') if isinstance(title, str) else '') + description.text()
                break
    else:
        text = content.strip()
    if not 30 <= len(text) <= 20000:
        raise ValueError('The page did not provide 30–20,000 characters of usable job text. Paste the relevant job description instead.')
    return text


def public_target(url):
    if not isinstance(url, str) or not 1 <= len(url) <= 2048 or any(c.isspace() or ord(c) < 32 for c in url):
        raise ValueError('Enter a public http:// or https:// job-posting URL.')
    try:
        parsed = urlsplit(url)
        if parsed.scheme not in ('http', 'https') or not parsed.hostname or parsed.username is not None or parsed.password is not None:
            raise ValueError()
        port = parsed.port or (443 if parsed.scheme == 'https' else 80)
        if port != (443 if parsed.scheme == 'https' else 80):
            raise ValueError()
        host = parsed.hostname.encode('idna').decode('ascii')
        addresses = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
            raise ValueError()
    except (ValueError, UnicodeError, OSError):
        raise ValueError('Use a public job-page URL on the standard HTTP or HTTPS port. Local and private addresses are not supported.') from None
    return parsed, host, port, addresses[0][4][0]


def fetch_job_description(url):
    deadline = time.monotonic() + 20
    try:
        for _ in range(4):
            parsed, host, port, address = public_target(url)
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise TimeoutError()
            connection = http.client.HTTPConnection(host, port, timeout=min(8, remaining))
            sock = None
            try:
                # Connect to the vetted IP, without a second DNS lookup (rebind protection).
                sock = socket.create_connection((address, port), timeout=min(8, remaining))
                if parsed.scheme == 'https':
                    sock = ssl.create_default_context().wrap_socket(sock, server_hostname=host)
                connection.sock = sock
                target = parsed.path or '/'
                if parsed.query:
                    target += '?' + parsed.query
                connection.request('GET', target, headers={'User-Agent': 'ResumeIQ/1.0 job-description importer', 'Accept': 'text/html, text/plain', 'Accept-Encoding': 'identity'})
                response = connection.getresponse()
                if response.status in (301, 302, 303, 307, 308):
                    location = response.getheader('Location')
                    if not location:
                        raise ValueError(FAILURE)
                    url = urljoin(url, location)
                    continue  # Every redirect must pass the same public-address checks.
                if response.status != 200:
                    raise ValueError(FAILURE)
                media_type = response.headers.get_content_type()
                if media_type not in ('text/html', 'application/xhtml+xml', 'text/plain') or response.getheader('Content-Encoding', 'identity').lower() != 'identity':
                    raise ValueError(FAILURE)
                chunks, size = [], 0
                while True:
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        raise TimeoutError()
                    sock.settimeout(min(8, remaining))
                    chunk = response.read1(min(65536, MAX_PAGE_BYTES + 1 - size))
                    if not chunk:
                        break
                    chunks.append(chunk)
                    size += len(chunk)
                    if size > MAX_PAGE_BYTES:
                        raise ValueError('This page is too large to import. Paste the job description instead.')
                charset = response.headers.get_content_charset() or 'utf-8'
                content = b''.join(chunks).decode(charset, errors='replace')
                return extract_job_text(content, html=media_type != 'text/plain')
            finally:
                connection.close()
                if sock is not None:
                    sock.close()
        raise ValueError('Too many redirects. Paste the job description instead.')
    except ValueError:
        raise
    except (OSError, http.client.HTTPException, LookupError, RecursionError):
        raise ValueError(FAILURE) from None
