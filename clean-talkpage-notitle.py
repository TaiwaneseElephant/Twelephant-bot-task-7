import re, json, pywikibot

def save(site, page, func = lambda x:x, summary:str = "", max_retry_times:int = 3) -> bool:
    if page.exists() and page.botMayEdit():
        original_text = page.text
    else:
      return False
    for _ in range(max_retry_times):
        try:
            page.text = func(original_text)
            if page.text != original_text:
                page.save(summary, minor = True, bot=True)
                return True
            else:
                print("No difference.")
                return False
        except pywikibot.exceptions.EditConflictError:
            print(f"Warning! There is an edit conflict on page '{page.title()}'!", flush=True)
            original_text = page.get(force = True, get_redirect = False)
        except pywikibot.exceptions.LockedPageError:
            print(f"Warning! The edit attempt on page '{page.title()}' was disallowed because the page is protected!", flush=True)
            break
        except pywikibot.exceptions.AbuseFilterDisallowedError:
            print(f"Warning! The edit attempt on page '{page.title()}' was disallowed by the AbuseFilter!", flush=True)
            break
        except pywikibot.exceptions.SpamblacklistError:
            print(f"Warning! The edit attempt on page '{page.title()}' was disallowed by the SpamFilter because the edit add blacklisted URL!", flush=True)
            break
        except pywikibot.exceptions.TitleblacklistError:
            print(f"Warning! The edit attempt on page '{page.title()}' was disallowed because the title is blacklisted!", flush=True)
            break
        except pywikibot.exceptions.OtherPageSaveError as e:
            print(f"Warning! The edit attempt on page '{page.title()}' was disallowed due to {e}!", flush=True)
            break
    print(f"The attempt to edit the page '{page.title()}' was stopped because of the error.", flush=True)
    return False

def main():
    site = pywikibot.Site("wikipedia:zh")
    try:
        config = json.loads(pywikibot.Page(site, "User:Twelephant-bot/task/7/config.json").text)
        if not config["Enable"]:
            print("Stop.")
            return
        query = config["query"]
        namespaces = config["namespaces"]
        pattern = re.compile(config["pattern"])
        replacement = config["replacement"]
        summary = config["summary"]
    except:
        print("Failed to load config.")
        return
    pageprocess = lambda x : pattern.sub(replacement, x)
    for page in site.search(query, namespaces=namespaces, content=True):
        success = save(site, page, pageprocess, summary)
        if success:
            t += 1
            if t % 10 == 0:
                try:
                    config = json.loads(pywikibot.Page(site, "User:Twelephant-bot/task/7/config.json").text)
                    if not config["Enable"]:
                        print("Stop.")
                        return
                    pattern = re.compile(config["pattern"])
                    replacement = config["replacement"]
                    summary = config["summary"]
                except:
                    print("Failed to load config.")
                    return

if __name__ == "__main__":
    main()
