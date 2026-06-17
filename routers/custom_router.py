from fastapi import APIRouter as FastAPIRouter
from typing import Any, Callable

class APIRouter(FastAPIRouter):
    def add_api_route(self, path: str, endpoint: Callable[..., Any], **kwargs: Any) -> None:
        super().add_api_route(path, endpoint, **kwargs)
        
        # Determine the alternative path
        if path == "/":
            alt_path = ""
        elif path == "":
            alt_path = "/"
        elif path.endswith("/"):
            alt_path = path[:-1]
        else:
            alt_path = path + "/"
            
        alt_kwargs = kwargs.copy()
        alt_kwargs["include_in_schema"] = False
        super().add_api_route(alt_path, endpoint, **alt_kwargs)
