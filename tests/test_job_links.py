import ipaddress
import socket
import unittest
from email.message import Message
from unittest.mock import Mock, patch

import job_links

DESCRIPTION = 'Use SQL and customer research to prioritize product roadmap decisions.'


def addresses(ip='93.184.216.34'):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, '', (ip, 443))]


def response(status=200, content=None, media='text/html', location=None):
    result = Mock()
    result.status = status
    headers = Message()
    headers['Content-Type'] = media
    if location:
        headers['Location'] = location
    result.headers = headers
    result.getheader.side_effect = lambda key, default=None: headers.get(key, default)
    result.read1.side_effect = [content or ('<p>' + DESCRIPTION + '</p>').encode(), b'']
    return result


class JobLinkTests(unittest.TestCase):
    def test_extracts_visible_text_without_scripts(self):
        text = job_links.extract_job_text('<h1>Product manager</h1><script>secret script</script><style>secret CSS</style><p>' + DESCRIPTION + '</p>')
        self.assertIn(DESCRIPTION, text)
        self.assertNotIn('secret', text)

    def test_prefers_structured_job_description(self):
        page = '<p>Unrelated website navigation and menu options.</p><script type="application/ld+json">{"@graph":[{"@type":"JobPosting","title":"Fictional PM","description":"<p>' + DESCRIPTION + '</p>"}]}</script>'
        self.assertEqual(job_links.extract_job_text(page), 'Fictional PM\n' + DESCRIPTION)

    def test_rejects_short_and_oversized_text(self):
        for text in ('Login', 'x' * 20001):
            with self.assertRaises(ValueError):
                job_links.extract_job_text(text)

    def test_bad_urls_never_connect(self):
        for url in (None, 5, 'file:///etc/passwd', 'ftp://example.com', 'https://name:password@example.com', 'http://example.com:8000/', 'https://example.com/\nInjected', 'x' * 2049):
            with patch('job_links.socket.create_connection') as connect:
                with self.assertRaises(ValueError):
                    job_links.fetch_job_description(url)
                connect.assert_not_called()

    def test_blocks_private_loopback_linklocal_and_mixed_dns(self):
        for ip in ('127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1', '::1', 'fc00::1', '::ffff:127.0.0.1'):
            with patch('job_links.socket.getaddrinfo', return_value=addresses(ip)), patch('job_links.socket.create_connection') as connect:
                with self.assertRaises(ValueError):
                    job_links.fetch_job_description('https://example.com/job')
                connect.assert_not_called()
        with patch('job_links.socket.getaddrinfo', return_value=addresses() + addresses('127.0.0.1')):
            with self.assertRaises(ValueError):
                job_links.public_target('https://example.com/job')

    @patch('job_links.socket.getaddrinfo', return_value=addresses())
    @patch('job_links.socket.create_connection')
    @patch('job_links.http.client.HTTPConnection')
    @patch('job_links.ssl.create_default_context')
    def test_connects_to_vetted_ip_with_hostname_tls(self, tls, connection, connect, dns):
        connection.return_value.getresponse.return_value = response()
        self.assertEqual(job_links.fetch_job_description('https://example.com/job?id=1'), DESCRIPTION)
        self.assertEqual(connect.call_args[0][0], ('93.184.216.34', 443))
        self.assertEqual(dns.call_count, 1)
        tls.return_value.wrap_socket.assert_called_once_with(connect.return_value, server_hostname='example.com')
        self.assertEqual(connection.return_value.request.call_args[0][:2], ('GET', '/job?id=1'))
        self.assertNotIn('Authorization', connection.return_value.request.call_args[1]['headers'])

    @patch('job_links.socket.getaddrinfo', side_effect=[addresses(), addresses('127.0.0.1')])
    @patch('job_links.socket.create_connection')
    @patch('job_links.http.client.HTTPConnection')
    def test_redirect_cannot_reach_private_network(self, connection, connect, dns):
        connection.return_value.getresponse.return_value = response(302, location='http://127.0.0.1/private')
        with self.assertRaises(ValueError):
            job_links.fetch_job_description('http://example.com/job')
        self.assertEqual(connect.call_count, 1)

    @patch('job_links.socket.getaddrinfo', return_value=addresses())
    @patch('job_links.socket.create_connection')
    @patch('job_links.http.client.HTTPConnection')
    def test_rejects_blocked_binary_large_and_slow_responses(self, connection, connect, dns):
        for item in (response(403), response(media='application/pdf'), response(content=b'x' * (job_links.MAX_PAGE_BYTES + 1))):
            connection.return_value.getresponse.return_value = item
            with self.assertRaises(ValueError):
                job_links.fetch_job_description('http://example.com/job')
        connect.side_effect = TimeoutError('private network details')
        with self.assertRaisesRegex(ValueError, '^Could not read this public job page'):
            job_links.fetch_job_description('http://example.com/job')


if __name__ == '__main__':
    unittest.main()
